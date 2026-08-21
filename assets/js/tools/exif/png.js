import { asciiFromBytes, pngTextGroup } from "./tags.js";
import { fieldIdsToGroups, parseTiff, tiffFields, writeTiff } from "./tiff.js";
import { xmpFields } from "./iptc.js";

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function u32(bytes, i) {
  return ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
}

function typeAt(bytes, i) {
  return String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
}

export function splitPng(bytes) {
  if (bytes.length < 16) return null;
  for (let i = 0; i < 8; i += 1) {
    if (bytes[i] !== PNG_SIG[i]) return null;
  }
  const chunks = [];
  let i = 8;
  while (i + 12 <= bytes.length) {
    const len = u32(bytes, i);
    const type = typeAt(bytes, i + 4);
    const dataStart = i + 8;
    const dataEnd = dataStart + len;
    const crcEnd = dataEnd + 4;
    if (crcEnd > bytes.length) break;
    chunks.push({
      type,
      data: bytes.subarray(dataStart, dataEnd),
      raw: bytes.subarray(i, crcEnd),
    });
    i = crcEnd;
    if (type === "IEND") break;
  }
  return chunks;
}

function keywordFromText(data) {
  let n = 0;
  while (n < data.length && data[n] !== 0) n += 1;
  return asciiFromBytes(data.subarray(0, n));
}

function textValue(data) {
  let n = 0;
  while (n < data.length && data[n] !== 0) n += 1;
  return asciiFromBytes(data.subarray(n + 1));
}

function pngTimeValue(data) {
  if (data.length < 7) return "Present";
  const year = (data[0] << 8) | data[1];
  const month = String(data[2]).padStart(2, "0");
  const day = String(data[3]).padStart(2, "0");
  const hour = String(data[4]).padStart(2, "0");
  const min = String(data[5]).padStart(2, "0");
  const sec = String(data[6]).padStart(2, "0");
  return `${year}:${month}:${day} ${hour}:${min}:${sec}`;
}

export function inspectPng(bytes) {
  const chunks = splitPng(bytes);
  if (!chunks) return null;
  const fields = [];
  let parsedTiff = null;

  chunks.forEach((chunk, index) => {
    if (chunk.type === "eXIf") {
      parsedTiff = parseTiff(chunk.data);
      if (parsedTiff) fields.push(...tiffFields(parsedTiff));
    }
    if (chunk.type === "tIME") {
      fields.push({
        id: "when:png-time",
        group: "when",
        label: "PNG timestamp",
        value: pngTimeValue(chunk.data),
        chunkIndex: index,
      });
    }
    if (chunk.type === "tEXt" || chunk.type === "iTXt" || chunk.type === "zTXt") {
      const keyword = keywordFromText(chunk.data);
      const group = pngTextGroup(keyword);
      let value = keyword;
      if (chunk.type === "tEXt") value = textValue(chunk.data) || keyword;
      if (keyword.toLowerCase() === "xml:com.adobe.xmp") {
        fields.push(...xmpFields(textValue(chunk.data)));
        return;
      }
      fields.push({
        id: `${group}:png:${index}`,
        group,
        label: keyword || chunk.type,
        value: value || "Present",
        chunkIndex: index,
      });
    }
  });

  return { format: "png", fields: dedupe(fields), chunks, parsedTiff };
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

function dropChunk(chunk, selected, inspected) {
  if (chunk.type === "eXIf") {
    if (!inspected.parsedTiff) return true;
    const tiff = writeTiff(inspected.parsedTiff, selected);
    return { replace: tiff };
  }
  if (chunk.type === "tIME") return selected.has("when");
  if (chunk.type === "tEXt" || chunk.type === "iTXt" || chunk.type === "zTXt") {
    const keyword = keywordFromText(chunk.data);
    const group = pngTextGroup(keyword);
    if (keyword.toLowerCase() === "xml:com.adobe.xmp") {
      return (
        selected.has("document") ||
        selected.has("location") ||
        selected.has("when") ||
        selected.has("author")
      );
    }
    return selected.has(group);
  }
  return false;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeChunk(type, data) {
  const buf = new Uint8Array(12 + data.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, data.length);
  buf[4] = type.charCodeAt(0);
  buf[5] = type.charCodeAt(1);
  buf[6] = type.charCodeAt(2);
  buf[7] = type.charCodeAt(3);
  buf.set(data, 8);
  const crc = crc32(buf.subarray(4, 8 + data.length));
  view.setUint32(8 + data.length, crc);
  return buf;
}

export function stripPng(inspected, selectedIds) {
  const selected = fieldIdsToGroups(selectedIds);
  const out = [new Uint8Array(PNG_SIG)];
  inspected.chunks.forEach((chunk, index) => {
    const drop = dropChunk(chunk, selected, inspected);
    if (drop === true) return;
    if (drop && drop.replace) {
      out.push(encodeChunk("eXIf", drop.replace));
      return;
    }
    if (drop && drop.replace === null) return;
    out.push(chunk.raw);
  });
  const total = out.reduce((n, p) => n + p.length, 0);
  const bytes = new Uint8Array(total);
  let o = 0;
  out.forEach((p) => {
    bytes.set(p, o);
    o += p.length;
  });
  return bytes;
}
