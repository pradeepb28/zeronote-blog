import {
  EXIF_IFD,
  GPS_IFD,
  TYPE_SIZE,
  asciiFromBytes,
  gpsDecimal,
  groupForTag,
  userCommentText,
} from "./tags.js";

function getSize(type) {
  return TYPE_SIZE[type] || 1;
}

function reader(bytes, le) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    le,
    length: bytes.length,
    u16(offset) {
      if (offset + 2 > bytes.length) return 0;
      return view.getUint16(offset, le);
    },
    u32(offset) {
      if (offset + 4 > bytes.length) return 0;
      return view.getUint32(offset, le);
    },
    slice(offset, length) {
      const end = Math.min(bytes.length, offset + length);
      if (offset < 0 || offset >= bytes.length) return new Uint8Array(0);
      return bytes.subarray(offset, end);
    },
  };
}

function parseIfd(r, offset, ifdName, seen) {
  const tags = [];
  if (offset < 0 || offset + 2 > r.length) return tags;
  if (seen.has(offset)) return tags;
  seen.add(offset);

  const count = r.u16(offset);
  if (count <= 0 || count > 256) return tags;

  for (let i = 0; i < count; i += 1) {
    const entry = offset + 2 + i * 12;
    const id = r.u16(entry);
    const type = r.u16(entry + 2);
    const countN = r.u32(entry + 4);
    const size = getSize(type) * countN;
    if (!size || size > 1024 * 1024) continue;
    const inline = r.u32(entry + 8);
    let value;
    if (size <= 4) {
      value = r.slice(entry + 8, 4).slice(0, size);
    } else {
      value = r.slice(inline, size);
    }
    tags.push({ id, type, count: countN, value, ifd: ifdName });
  }
  return tags;
}

export function parseTiff(bytes) {
  if (bytes.length < 8) return null;
  const b0 = bytes[0];
  const b1 = bytes[1];
  let le;
  if (b0 === 0x49 && b1 === 0x49) le = true;
  else if (b0 === 0x4d && b1 === 0x4d) le = false;
  else return null;

  const r = reader(bytes, le);
  if (r.u16(2) !== 42) return null;
  const seen = new Set();
  const ifd0Offset = r.u32(4);
  const ifd0 = parseIfd(r, ifd0Offset, "ifd0", seen);

  let exif = [];
  let gps = [];
  for (const tag of ifd0) {
    if (tag.id === EXIF_IFD && tag.value.length >= 4) {
      const view = new DataView(tag.value.buffer, tag.value.byteOffset, tag.value.byteLength);
      const off = le ? view.getUint32(0, true) : view.getUint32(0, false);
      exif = parseIfd(r, off, "exif", seen);
    }
    if (tag.id === GPS_IFD && tag.value.length >= 4) {
      const view = new DataView(tag.value.buffer, tag.value.byteOffset, tag.value.byteLength);
      const off = le ? view.getUint32(0, true) : view.getUint32(0, false);
      gps = parseIfd(r, off, "gps", seen);
    }
  }

  return { le, ifd0, exif, gps };
}

function tagValue(tags, id) {
  return tags.find((t) => t.id === id) || null;
}

function decodeTagText(tag) {
  if (!tag) return "";
  if (tag.id === 0x9286) return userCommentText(tag.value);
  if (tag.type === 2) return asciiFromBytes(tag.value);
  if (tag.id >= 0x9c9b && tag.id <= 0x9c9f) {
    // XP* UTF-16LE often
    const parts = [];
    for (let i = 0; i + 1 < tag.value.length; i += 2) {
      const c = tag.value[i] | (tag.value[i + 1] << 8);
      if (c === 0) break;
      if (c >= 32) parts.push(String.fromCharCode(c));
    }
    return parts.join("").trim();
  }
  return asciiFromBytes(tag.value);
}

export function tiffFields(parsed) {
  if (!parsed) return [];
  const fields = [];
  const { ifd0, exif, gps, le } = parsed;
  const all = ifd0.concat(exif);

  const lat = tagValue(gps, 0x0002);
  const lon = tagValue(gps, 0x0004);
  const latRef = decodeTagText(tagValue(gps, 0x0001));
  const lonRef = decodeTagText(tagValue(gps, 0x0003));
  if (gps.length) {
    const formatted = lat && lon ? gpsDecimal(lat.value, latRef, lon.value, lonRef, le) : null;
    fields.push({
      id: "location:gps",
      group: "location",
      label: "GPS",
      value: formatted || "Present",
    });
  }

  const make = decodeTagText(tagValue(all, 0x010f));
  const model = decodeTagText(tagValue(all, 0x0110));
  const software = decodeTagText(tagValue(all, 0x0131));
  const serial =
    decodeTagText(tagValue(all, 0xa431)) || decodeTagText(tagValue(all, 0xa435));
  const lens =
    [decodeTagText(tagValue(all, 0xa433)), decodeTagText(tagValue(all, 0xa434))]
      .filter(Boolean)
      .join(" ") || decodeTagText(tagValue(all, 0x013c));

  if (make) fields.push({ id: "device:make", group: "device", label: "Make", value: make });
  if (model) fields.push({ id: "device:model", group: "device", label: "Model", value: model });
  if (software) {
    fields.push({ id: "device:software", group: "device", label: "Software", value: software });
  }
  if (serial) fields.push({ id: "device:serial", group: "device", label: "Serial", value: serial });
  if (lens) fields.push({ id: "device:lens", group: "device", label: "Lens", value: lens });

  const taken = decodeTagText(tagValue(all, 0x9003));
  const digitized = decodeTagText(tagValue(all, 0x9004));
  const modified = decodeTagText(tagValue(all, 0x0132));
  if (taken) fields.push({ id: "when:original", group: "when", label: "Date taken", value: taken });
  if (digitized && digitized !== taken) {
    fields.push({ id: "when:digitized", group: "when", label: "Date digitized", value: digitized });
  }
  if (modified && modified !== taken && modified !== digitized) {
    fields.push({ id: "when:modified", group: "when", label: "Date modified", value: modified });
  }

  if (tagValue(all, 0x927c)) {
    fields.push({
      id: "makernote",
      group: "makernote",
      label: "Proprietary camera data",
      value: "Present (not shown)",
    });
  }

  const artist = decodeTagText(tagValue(all, 0x013b));
  const copyright = decodeTagText(tagValue(all, 0x8298));
  const owner = decodeTagText(tagValue(all, 0xa430));
  const comment =
    decodeTagText(tagValue(all, 0x9286)) || decodeTagText(tagValue(all, 0x010e));
  if (artist) fields.push({ id: "author:artist", group: "author", label: "Artist", value: artist });
  if (copyright) {
    fields.push({ id: "author:copyright", group: "author", label: "Copyright", value: copyright });
  }
  if (owner) fields.push({ id: "author:owner", group: "author", label: "Owner", value: owner });
  if (comment) {
    fields.push({ id: "author:comment", group: "author", label: "Comment", value: comment });
  }

  if (tagValue(all, 0xa420)) {
    fields.push({
      id: "document:unique-id",
      group: "document",
      label: "Unique image ID",
      value: decodeTagText(tagValue(all, 0xa420)) || "Present",
    });
  }

  return fields;
}

function shouldDropTag(tag, selected) {
  const group = groupForTag(tag.id, tag.ifd);
  if (!group) return false;
  if (group === "location") return selected.has("location");
  if (group === "device") return selected.has("device");
  if (group === "when") return selected.has("when");
  if (group === "makernote") return selected.has("makernote");
  if (group === "author") return selected.has("author");
  if (group === "document") return selected.has("document");
  return false;
}

function copyTag(tag) {
  return {
    id: tag.id,
    type: tag.type,
    count: tag.count,
    value: tag.value,
  };
}

function align2(n) {
  return n + (n % 2);
}

function putU16(view, offset, value, le) {
  view.setUint16(offset, value, le);
}

function putU32(view, offset, value, le) {
  view.setUint32(offset, value, le);
}

function ifdByteLength(tags) {
  let extra = 0;
  for (const tag of tags) {
    const size = getSize(tag.type) * tag.count;
    if (size > 4) extra += align2(size);
  }
  return 2 + 12 * tags.length + 4 + extra;
}

function writeIfd(view, start, tags, le, nextIfd) {
  putU16(view, start, tags.length, le);
  let extra = start + 2 + 12 * tags.length + 4;
  tags.forEach((tag, i) => {
    const entry = start + 2 + i * 12;
    const size = getSize(tag.type) * tag.count;
    putU16(view, entry, tag.id, le);
    putU16(view, entry + 2, tag.type, le);
    putU32(view, entry + 4, tag.count, le);
    if (size <= 4) {
      const slot = new Uint8Array(view.buffer, view.byteOffset + entry + 8, 4);
      slot.fill(0);
      slot.set(tag.value.subarray(0, Math.min(4, tag.value.length)));
    } else {
      putU32(view, entry + 8, extra, le);
      const dest = new Uint8Array(view.buffer, view.byteOffset + extra, tag.value.length);
      dest.set(tag.value);
      extra += align2(size);
    }
  });
  putU32(view, start + 2 + 12 * tags.length, nextIfd, le);
  return extra;
}

function longTag(id, offset, le) {
  const value = new Uint8Array(4);
  const view = new DataView(value.buffer);
  view.setUint32(0, offset, le);
  return { id, type: 4, count: 1, value };
}

export function writeTiff(parsed, selected) {
  const le = parsed.le;
  const ifd0Keep = parsed.ifd0
    .filter((t) => t.id !== EXIF_IFD && t.id !== GPS_IFD && t.id !== 0x014a)
    .filter((t) => !shouldDropTag(t, selected))
    .map(copyTag);
  const exifKeep = parsed.exif.filter((t) => !shouldDropTag(t, selected)).map(copyTag);
  const gpsKeep = selected.has("location")
    ? []
    : parsed.gps.filter((t) => !shouldDropTag(t, selected)).map(copyTag);

  ifd0Keep.sort((a, b) => a.id - b.id);
  exifKeep.sort((a, b) => a.id - b.id);
  gpsKeep.sort((a, b) => a.id - b.id);

  if (!ifd0Keep.length && !exifKeep.length && !gpsKeep.length) return null;

  // Placeholder pointer tags so layout can be measured, then rewritten with real offsets.
  const ifd0WithPtrs = ifd0Keep.slice();
  if (exifKeep.length) ifd0WithPtrs.push({ id: EXIF_IFD, type: 4, count: 1, value: new Uint8Array(4) });
  if (gpsKeep.length) ifd0WithPtrs.push({ id: GPS_IFD, type: 4, count: 1, value: new Uint8Array(4) });
  ifd0WithPtrs.sort((a, b) => a.id - b.id);

  const ifd0Start = 8;
  const ifd0Len = ifdByteLength(ifd0WithPtrs);
  const exifStart = ifd0Start + ifd0Len;
  const exifLen = exifKeep.length ? ifdByteLength(exifKeep) : 0;
  const gpsStart = exifStart + exifLen;
  const gpsLen = gpsKeep.length ? ifdByteLength(gpsKeep) : 0;
  const total = gpsStart + gpsLen;

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  if (le) {
    out[0] = 0x49;
    out[1] = 0x49;
  } else {
    out[0] = 0x4d;
    out[1] = 0x4d;
  }
  putU16(view, 2, 42, le);
  putU32(view, 4, ifd0Start, le);

  const ifd0Final = ifd0Keep.slice();
  if (exifKeep.length) ifd0Final.push(longTag(EXIF_IFD, exifStart, le));
  if (gpsKeep.length) ifd0Final.push(longTag(GPS_IFD, gpsStart, le));
  ifd0Final.sort((a, b) => a.id - b.id);

  writeIfd(view, ifd0Start, ifd0Final, le, 0);
  if (exifKeep.length) writeIfd(view, exifStart, exifKeep, le, 0);
  if (gpsKeep.length) writeIfd(view, gpsStart, gpsKeep, le, 0);
  return out;
}

export function fieldIdsToGroups(ids) {
  const selected = new Set();
  ids.forEach((id) => {
    if (id.startsWith("location:")) selected.add("location");
    else if (id.startsWith("device:")) selected.add("device");
    else if (id.startsWith("when:")) selected.add("when");
    else if (id === "makernote") selected.add("makernote");
    else if (id.startsWith("author:")) selected.add("author");
    else if (id.startsWith("document:")) selected.add("document");
  });
  return selected;
}
