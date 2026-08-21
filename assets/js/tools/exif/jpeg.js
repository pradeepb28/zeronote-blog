import { fieldIdsToGroups, parseTiff, tiffFields, writeTiff } from "./tiff.js";
import { filterIrb, iptcFields, iptcFromIrb, parseIrb } from "./iptc.js";

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const XMP_HEADER = "http://ns.adobe.com/xap/1.0/\0";

function startsWith(data, bytes) {
  if (data.length < bytes.length) return false;
  return bytes.every((b, i) => data[i] === b);
}

function startsWithStr(data, str) {
  if (data.length < str.length) return false;
  for (let i = 0; i < str.length; i += 1) {
    if (data[i] !== str.charCodeAt(i)) return false;
  }
  return true;
}

export function splitJpeg(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const segs = [];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) {
      segs.push({ marker: 0, data: bytes.subarray(i) });
      break;
    }
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i];
    i += 1;
    if (marker === 0xd9) {
      segs.push({ marker: 0xd9, data: new Uint8Array(0) });
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      segs.push({ marker, data: new Uint8Array(0) });
      continue;
    }
    if (i + 2 > bytes.length) break;
    const len = (bytes[i] << 8) | bytes[i + 1];
    if (len < 2 || i + len > bytes.length) break;
    const data = bytes.subarray(i + 2, i + len);
    segs.push({ marker, data });
    i += len;
    if (marker === 0xda) {
      segs.push({ marker: 0, data: bytes.subarray(i) });
      break;
    }
  }
  return segs;
}

function tiffFromExifApp(data) {
  if (!startsWith(data, EXIF_HEADER)) return null;
  return parseTiff(data.subarray(6));
}

export function inspectJpeg(bytes) {
  const segs = splitJpeg(bytes);
  if (!segs) return null;
  const fields = [];
  let parsedTiff = null;
  let hasIptc = false;
  let hasXmp = false;

  segs.forEach((seg) => {
    if (seg.marker === 0xe1) {
      const tiff = tiffFromExifApp(seg.data);
      if (tiff) {
        parsedTiff = tiff;
        fields.push(...tiffFields(tiff));
        return;
      }
      if (startsWithStr(seg.data, XMP_HEADER)) {
        hasXmp = true;
      }
    }
    if (seg.marker === 0xed) {
      const irb = parseIrb(seg.data);
      const iptc = iptcFromIrb(irb);
      if (iptc.length) {
        hasIptc = true;
        fields.push(...iptcFields(iptc));
      }
    }
  });

  if (hasIptc || hasXmp) {
    fields.push({
      id: "document:packet",
      group: "document",
      label: "Document and publishing",
      value: hasXmp && hasIptc ? "XMP and IPTC present" : hasXmp ? "XMP packet present" : "IPTC packet present",
    });
  }

  return { format: "jpeg", fields: dedupeFields(fields), parsedTiff, segs };
}

function dedupeFields(fields) {
  const seen = new Set();
  const out = [];
  fields.forEach((f) => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    out.push(f);
  });
  return out;
}

function buildExifSegment(tiffBytes) {
  const data = new Uint8Array(6 + tiffBytes.length);
  data.set(EXIF_HEADER, 0);
  data.set(tiffBytes, 6);
  return { marker: 0xe1, data };
}

export function stripJpeg(inspected, selectedIds) {
  const selected = fieldIdsToGroups(selectedIds);
  const dropXmp =
    selected.has("document") ||
    selected.has("location") ||
    selected.has("when") ||
    selected.has("author");
  const outSegs = [];
  let wroteExif = false;

  inspected.segs.forEach((seg) => {
    if (seg.marker === 0xe1 && startsWith(seg.data, EXIF_HEADER)) {
      if (wroteExif) return;
      wroteExif = true;
      if (!inspected.parsedTiff) return;
      const tiff = writeTiff(inspected.parsedTiff, selected);
      if (tiff) outSegs.push(buildExifSegment(tiff));
      return;
    }
    if (seg.marker === 0xe1 && startsWithStr(seg.data, XMP_HEADER)) {
      if (dropXmp) return;
      outSegs.push(seg);
      return;
    }
    if (seg.marker === 0xed) {
      const filtered = filterIrb(seg.data, selected);
      if (filtered && filtered.length) outSegs.push({ marker: 0xed, data: filtered });
      return;
    }
    outSegs.push(seg);
  });

  return assembleJpeg(outSegs);
}

function assembleJpeg(segs) {
  let total = 2;
  segs.forEach((seg) => {
    if (seg.marker === 0) total += seg.data.length;
    else if (seg.marker === 0xd9) total += 2;
    else if (seg.marker === 0x01 || (seg.marker >= 0xd0 && seg.marker <= 0xd7)) total += 2;
    else total += 4 + seg.data.length;
  });
  const out = new Uint8Array(total);
  out[0] = 0xff;
  out[1] = 0xd8;
  let o = 2;
  segs.forEach((seg) => {
    if (seg.marker === 0) {
      out.set(seg.data, o);
      o += seg.data.length;
      return;
    }
    out[o] = 0xff;
    out[o + 1] = seg.marker;
    o += 2;
    if (seg.marker === 0xd9 || seg.marker === 0x01 || (seg.marker >= 0xd0 && seg.marker <= 0xd7)) {
      return;
    }
    const len = seg.data.length + 2;
    out[o] = (len >> 8) & 0xff;
    out[o + 1] = len & 0xff;
    out.set(seg.data, o + 2);
    o += 2 + seg.data.length;
  });
  return out;
}
