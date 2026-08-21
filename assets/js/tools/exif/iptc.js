import { asciiFromBytes } from "./tags.js";

const IPTC_CITY = [2, 90];
const IPTC_SUBLOCATION = [2, 92];
const IPTC_STATE = [2, 95];
const IPTC_COUNTRY = [2, 101];
const IPTC_COUNTRY_CODE = [2, 100];
const IPTC_BYLINE = [2, 80];
const IPTC_BYLINE_TITLE = [2, 85];
const IPTC_CREDIT = [2, 110];
const IPTC_SOURCE = [2, 115];
const IPTC_COPYRIGHT = [2, 116];
const IPTC_CONTACT = [2, 118];
const IPTC_CAPTION = [2, 120];
const IPTC_WRITER = [2, 122];

export function parseIptcDatasets(data) {
  const items = [];
  let i = 0;
  while (i + 5 <= data.length) {
    if (data[i] !== 0x1c) {
      i += 1;
      continue;
    }
    const record = data[i + 1];
    const dataset = data[i + 2];
    let length = (data[i + 3] << 8) | data[i + 4];
    let header = 5;
    if (length & 0x8000) {
      const n = length & 0x7fff;
      if (i + 5 + n > data.length) break;
      length = 0;
      for (let b = 0; b < n; b += 1) length = (length << 8) | data[i + 5 + b];
      header = 5 + n;
    }
    const start = i + header;
    if (start + length > data.length) break;
    items.push({
      record,
      dataset,
      bytes: data.subarray(i, start + length),
      text: asciiFromBytes(data.subarray(start, start + length)),
    });
    i = start + length;
  }
  return items;
}

export function iptcFields(items) {
  const fields = [];
  const city = items.find((x) => x.record === 2 && x.dataset === 90);
  const country = items.find((x) => x.record === 2 && x.dataset === 101);
  if (city && city.text) {
    fields.push({ id: "location:city", group: "location", label: "City", value: city.text });
  }
  if (country && country.text) {
    fields.push({ id: "location:country", group: "location", label: "Country", value: country.text });
  }
  return fields;
}

function dropIptcItem(item, selected) {
  const loc =
    (item.record === IPTC_CITY[0] && item.dataset === IPTC_CITY[1]) ||
    (item.record === IPTC_SUBLOCATION[0] && item.dataset === IPTC_SUBLOCATION[1]) ||
    (item.record === IPTC_STATE[0] && item.dataset === IPTC_STATE[1]) ||
    (item.record === IPTC_COUNTRY[0] && item.dataset === IPTC_COUNTRY[1]) ||
    (item.record === IPTC_COUNTRY_CODE[0] && item.dataset === IPTC_COUNTRY_CODE[1]);
  const author =
    (item.record === IPTC_BYLINE[0] && item.dataset === IPTC_BYLINE[1]) ||
    (item.record === IPTC_BYLINE_TITLE[0] && item.dataset === IPTC_BYLINE_TITLE[1]) ||
    (item.record === IPTC_CREDIT[0] && item.dataset === IPTC_CREDIT[1]) ||
    (item.record === IPTC_COPYRIGHT[0] && item.dataset === IPTC_COPYRIGHT[1]) ||
    (item.record === IPTC_CONTACT[0] && item.dataset === IPTC_CONTACT[1]) ||
    (item.record === IPTC_WRITER[0] && item.dataset === IPTC_WRITER[1]);
  const document =
    item.record === IPTC_CAPTION[0] && item.dataset === IPTC_CAPTION[1];
  const device = item.record === IPTC_SOURCE[0] && item.dataset === IPTC_SOURCE[1];
  if (loc && selected.has("location")) return true;
  if (author && selected.has("author")) return true;
  if (document && selected.has("document")) return true;
  if (device && selected.has("device")) return true;
  return false;
}

export function filterIptc(data, selected) {
  const items = parseIptcDatasets(data);
  const kept = items.filter((item) => !dropIptcItem(item, selected));
  if (!kept.length) return null;
  const total = kept.reduce((n, item) => n + item.bytes.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  kept.forEach((item) => {
    out.set(item.bytes, o);
    o += item.bytes.length;
  });
  return out;
}

const PS_HEADER = [0x50, 0x68, 0x6f, 0x74, 0x6f, 0x73, 0x68, 0x6f, 0x70, 0x20, 0x33, 0x2e, 0x30, 0x00];

function startsWithPs(data) {
  if (data.length < PS_HEADER.length) return false;
  return PS_HEADER.every((b, i) => data[i] === b);
}

export function parseIrb(data) {
  if (!startsWithPs(data)) return null;
  const resources = [];
  let i = PS_HEADER.length;
  while (i + 12 <= data.length) {
    if (data[i] !== 0x38 || data[i + 1] !== 0x42 || data[i + 2] !== 0x49 || data[i + 3] !== 0x4d) {
      break;
    }
    const id = (data[i + 4] << 8) | data[i + 5];
    const nameLen = data[i + 6];
    let nameBytes = 1 + nameLen;
    if (nameBytes % 2 === 1) nameBytes += 1;
    const sizeOff = i + 6 + nameBytes;
    if (sizeOff + 4 > data.length) break;
    const size = (data[sizeOff] << 24) | (data[sizeOff + 1] << 16) | (data[sizeOff + 2] << 8) | data[sizeOff + 3];
    const dataOff = sizeOff + 4;
    const dataEnd = dataOff + size;
    if (dataEnd > data.length) break;
    let padded = dataEnd;
    if (size % 2 === 1) padded += 1;
    resources.push({
      id,
      bytes: data.subarray(i, padded),
      payload: data.subarray(dataOff, dataEnd),
    });
    i = padded;
  }
  return { resources };
}

export function iptcFromIrb(irb) {
  if (!irb) return [];
  const block = irb.resources.find((r) => r.id === 0x0404);
  if (!block) return [];
  return parseIptcDatasets(block.payload);
}

export function filterIrb(data, selected) {
  const irb = parseIrb(data);
  if (!irb) return selected.has("document") ? null : data;

  const parts = [new Uint8Array(PS_HEADER)];
  let kept = 0;
  for (const res of irb.resources) {
    if (res.id === 0x0409 || res.id === 0x040c || res.id === 0x0406) continue;
    if (res.id === 0x0404) {
      if (selected.has("document")) continue;
      const filtered = filterIptc(res.payload, selected);
      if (!filtered) continue;
      parts.push(encodeResource(res.id, filtered));
      kept += 1;
      continue;
    }
    parts.push(res.bytes);
    kept += 1;
  }
  if (!kept) return null;
  return concat(parts);
}

function encodeResource(id, payload) {
  const size = payload.length;
  const nameBlock = 2; // length 0 + pad
  const pad = size % 2;
  const buf = new Uint8Array(4 + 2 + nameBlock + 4 + size + pad);
  buf[0] = 0x38;
  buf[1] = 0x42;
  buf[2] = 0x49;
  buf[3] = 0x4d;
  buf[4] = (id >> 8) & 0xff;
  buf[5] = id & 0xff;
  buf[6] = 0;
  buf[7] = 0;
  const sizeOff = 8;
  buf[sizeOff] = (size >>> 24) & 0xff;
  buf[sizeOff + 1] = (size >>> 16) & 0xff;
  buf[sizeOff + 2] = (size >>> 8) & 0xff;
  buf[sizeOff + 3] = size & 0xff;
  buf.set(payload, sizeOff + 4);
  return buf;
}

function concat(parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  parts.forEach((p) => {
    out.set(p, o);
    o += p.length;
  });
  return out;
}

export function xmpLooksPrivate(text) {
  const t = text.toLowerCase();
  return (
    t.includes("gps") ||
    t.includes("latitude") ||
    t.includes("longitude") ||
    t.includes("createdate") ||
    t.includes("modifydate") ||
    t.includes("datecreated") ||
    t.includes("dc:creator") ||
    t.includes("photoshop:credit") ||
    t.includes("personinimage") ||
    t.includes("history") ||
    t.includes("location")
  );
}

export function xmpFields(text) {
  const fields = [];
  if (!text) return fields;
  if (xmpLooksPrivate(text) || text.includes("<")) {
    fields.push({
      id: "document:xmp",
      group: "document",
      label: "Document metadata",
      value: "XMP packet present",
    });
  }
  return fields;
}

