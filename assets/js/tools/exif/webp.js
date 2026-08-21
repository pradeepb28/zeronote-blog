import { fieldIdsToGroups, parseTiff, tiffFields, writeTiff } from "./tiff.js";
import { xmpFields } from "./iptc.js";

function u32le(bytes, i) {
  return bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
}

function setU32le(bytes, i, value) {
  bytes[i] = value & 0xff;
  bytes[i + 1] = (value >>> 8) & 0xff;
  bytes[i + 2] = (value >>> 16) & 0xff;
  bytes[i + 3] = (value >>> 24) & 0xff;
}

function fourcc(bytes, i) {
  return String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
}

export function splitWebp(bytes) {
  if (bytes.length < 12) return null;
  if (fourcc(bytes, 0) !== "RIFF" || fourcc(bytes, 8) !== "WEBP") return null;
  const chunks = [];
  let i = 12;
  while (i + 8 <= bytes.length) {
    const type = fourcc(bytes, i);
    const size = u32le(bytes, i + 4);
    const dataStart = i + 8;
    const dataEnd = dataStart + size;
    if (dataEnd > bytes.length) break;
    const pad = size % 2;
    chunks.push({
      type,
      data: bytes.subarray(dataStart, dataEnd),
      raw: bytes.subarray(i, dataEnd + pad),
    });
    i = dataEnd + pad;
  }
  return chunks;
}

function decodeLatin1(data) {
  let out = "";
  for (let i = 0; i < data.length; i += 1) out += String.fromCharCode(data[i]);
  return out;
}

function tiffFromWebpExif(data) {
  if (data.length >= 6 && data[0] === 0x45 && data[1] === 0x78 && data[2] === 0x69 && data[3] === 0x66) {
    return parseTiff(data.subarray(6));
  }
  return parseTiff(data);
}

export function inspectWebp(bytes) {
  const chunks = splitWebp(bytes);
  if (!chunks) return null;
  const fields = [];
  let parsedTiff = null;

  chunks.forEach((chunk) => {
    if (chunk.type === "EXIF") {
      parsedTiff = tiffFromWebpExif(chunk.data);
      if (parsedTiff) fields.push(...tiffFields(parsedTiff));
    }
    if (chunk.type === "XMP ") {
      fields.push(...xmpFields(decodeLatin1(chunk.data)));
    }
  });

  return { format: "webp", fields: dedupe(fields), chunks, parsedTiff };
}

function dedupe(fields) {
  const seen = new Set();
  const out = [];
  fields.forEach((f) => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    out.push(f);
  });
  return out;
}

function encodeChunk(type, data) {
  const pad = data.length % 2;
  const buf = new Uint8Array(8 + data.length + pad);
  buf[0] = type.charCodeAt(0);
  buf[1] = type.charCodeAt(1);
  buf[2] = type.charCodeAt(2);
  buf[3] = type.charCodeAt(3);
  setU32le(buf, 4, data.length);
  buf.set(data, 8);
  return buf;
}

export function stripWebp(inspected, selectedIds) {
  const selected = fieldIdsToGroups(selectedIds);
  const dropXmp =
    selected.has("document") ||
    selected.has("location") ||
    selected.has("when") ||
    selected.has("author");
  const parts = [];
  let hasExif = false;
  let hasXmp = false;

  inspected.chunks.forEach((chunk) => {
    if (chunk.type === "EXIF") {
      if (!inspected.parsedTiff) return;
      const tiff = writeTiff(inspected.parsedTiff, selected);
      if (tiff) {
        parts.push(encodeChunk("EXIF", tiff));
        hasExif = true;
      }
      return;
    }
    if (chunk.type === "XMP ") {
      if (dropXmp) return;
      parts.push(chunk.raw);
      hasXmp = true;
      return;
    }
    if (chunk.type === "VP8X") {
      const data = new Uint8Array(chunk.data);
      if (data.length >= 1) {
        if (!hasExif && selected.size) data[0] &= ~(1 << 3);
        if (dropXmp) data[0] &= ~(1 << 2);
      }
      parts.push(encodeChunk("VP8X", data));
      return;
    }
    parts.push(chunk.raw);
  });

  // VP8X flags were written before we knew if EXIF remained. Second pass to fix flags.
  const rebuilt = [];
  parts.forEach((part) => {
    if (part.length >= 8 && fourcc(part, 0) === "VP8X") {
      const size = u32le(part, 4);
      const data = part.slice(8, 8 + size);
      if (data.length >= 1) {
        if (hasExif) data[0] |= 1 << 3;
        else data[0] &= ~(1 << 3);
        if (hasXmp) data[0] |= 1 << 2;
        else data[0] &= ~(1 << 2);
      }
      rebuilt.push(encodeChunk("VP8X", data));
      return;
    }
    rebuilt.push(part);
  });

  const payload = concat(rebuilt);
  const out = new Uint8Array(12 + payload.length);
  out[0] = 0x52;
  out[1] = 0x49;
  out[2] = 0x46;
  out[3] = 0x46;
  setU32le(out, 4, 4 + payload.length);
  out[8] = 0x57;
  out[9] = 0x45;
  out[10] = 0x42;
  out[11] = 0x50;
  out.set(payload, 12);
  return out;
}

function concat(parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const bytes = new Uint8Array(total);
  let o = 0;
  parts.forEach((p) => {
    bytes.set(p, o);
    o += p.length;
  });
  return bytes;
}
