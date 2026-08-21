export const ORIENTATION = 0x0112;
export const EXIF_IFD = 0x8769;
export const GPS_IFD = 0x8825;

export const TYPE_SIZE = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};

const DEVICE_TAGS = new Set([
  0x010f, // Make
  0x0110, // Model
  0x0131, // Software
  0x013c, // HostComputer
  0xa431, // BodySerialNumber
  0xa433, // LensMake
  0xa434, // LensModel
  0xa435, // LensSerialNumber
  0xc62f, // UniqueCameraModel
]);

const WHEN_TAGS = new Set([
  0x0132, // DateTime
  0x9003, // DateTimeOriginal
  0x9004, // DateTimeDigitized
  0x9290, // SubSecTime
  0x9291, // SubSecTimeOriginal
  0x9292, // SubSecTimeDigitized
  0x9010, // OffsetTime
  0x9011, // OffsetTimeOriginal
  0x9012, // OffsetTimeDigitized
]);

const AUTHOR_TAGS = new Set([
  0x010e, // ImageDescription
  0x013b, // Artist
  0x8298, // Copyright
  0x9286, // UserComment
  0xa430, // CameraOwnerName
  0x9c9b, // XPTitle
  0x9c9c, // XPComment
  0x9c9d, // XPAuthor
  0x9c9e, // XPKeywords
  0x9c9f, // XPSubject
]);

export function groupForTag(tag, ifd) {
  if (tag === ORIENTATION) return null;
  if (ifd === "gps") return "location";
  if (tag === 0x927c) return "makernote";
  if (DEVICE_TAGS.has(tag)) return "device";
  if (WHEN_TAGS.has(tag)) return "when";
  if (AUTHOR_TAGS.has(tag)) return "author";
  if (tag === 0xa420) return "document";
  return null;
}

export function asciiFromBytes(bytes) {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end -= 1;
  let out = "";
  for (let i = 0; i < end; i += 1) {
    const c = bytes[i];
    if (c < 32 || c > 126) {
      if (c === 10 || c === 13) out += " ";
      continue;
    }
    out += String.fromCharCode(c);
  }
  return out.trim();
}

export function userCommentText(bytes) {
  if (bytes.length <= 8) return "";
  return asciiFromBytes(bytes.subarray(8));
}

export function rationalToNumber(bytes, le, index) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const o = index * 8;
  if (o + 8 > bytes.length) return 0;
  const num = le ? view.getUint32(o, true) : view.getUint32(o, false);
  const den = le ? view.getUint32(o + 4, true) : view.getUint32(o + 4, false);
  if (!den) return 0;
  return num / den;
}

export function gpsDecimal(latBytes, latRef, lonBytes, lonRef, le) {
  if (!latBytes || !lonBytes || latBytes.length < 24 || lonBytes.length < 24) return null;
  const lat =
    rationalToNumber(latBytes, le, 0) +
    rationalToNumber(latBytes, le, 1) / 60 +
    rationalToNumber(latBytes, le, 2) / 3600;
  const lon =
    rationalToNumber(lonBytes, le, 0) +
    rationalToNumber(lonBytes, le, 1) / 60 +
    rationalToNumber(lonBytes, le, 2) / 3600;
  const latSigned = latRef === "S" ? -lat : lat;
  const lonSigned = lonRef === "W" ? -lon : lon;
  return `${latSigned.toFixed(5)}, ${lonSigned.toFixed(5)}`;
}

export function pngTextGroup(keyword) {
  const key = keyword.toLowerCase();
  if (key === "xml:com.adobe.xmp") return "document";
  if (key.includes("gps") || key.includes("latitude") || key.includes("longitude") || key === "location" || key === "city" || key === "country") {
    return "location";
  }
  if (key === "creation time" || key === "create-date" || key === "modify-date" || key === "date") return "when";
  if (key === "software" || key === "source" || key === "host") return "device";
  if (key === "author" || key === "copyright" || key === "comment" || key === "disclaimer") return "author";
  if (key === "title" || key === "description" || key === "warning") return "document";
  return "document";
}
