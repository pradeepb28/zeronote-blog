import { inspectJpeg, stripJpeg } from "./jpeg.js";
import { inspectPng, stripPng } from "./png.js";
import { inspectWebp, stripWebp } from "./webp.js";

function fourcc(bytes, i) {
  if (i + 4 > bytes.length) return "";
  return String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
}

export function detectPhoto(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes.length >= 12 && fourcc(bytes, 0) === "RIFF" && fourcc(bytes, 8) === "WEBP") return "webp";
  if (bytes.length >= 12 && fourcc(bytes, 4) === "ftyp") {
    const brand = fourcc(bytes, 8).toLowerCase();
    if (
      brand === "heic" ||
      brand === "heix" ||
      brand === "heif" ||
      brand === "mif1" ||
      brand === "msf1" ||
      brand === "avif"
    ) {
      return "heic";
    }
  }
  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a))
  ) {
    return "tiff";
  }
  if (bytes.length >= 6 && fourcc(bytes, 0) === "GIF8") return "gif";
  return "unknown";
}

export function unsupportedMessage(kind) {
  if (kind === "heic") return "HEIC is not supported. Export the photo as JPEG and try again.";
  if (kind === "tiff" || kind === "gif") return "This format is not supported. Use JPEG, PNG, or WebP.";
  return "Choose a JPEG, PNG, or WebP file.";
}

export function inspectPhoto(bytes) {
  const kind = detectPhoto(bytes);
  let result = null;
  if (kind === "jpeg") result = inspectJpeg(bytes);
  else if (kind === "png") result = inspectPng(bytes);
  else if (kind === "webp") result = inspectWebp(bytes);
  else return { error: unsupportedMessage(kind), kind };
  if (!result) return { error: "Could not read this file.", kind };
  return result;
}

export function stripPhoto(inspected, selectedIds) {
  if (!inspected || inspected.error) return null;
  if (inspected.format === "jpeg") return stripJpeg(inspected, selectedIds);
  if (inspected.format === "png") return stripPng(inspected, selectedIds);
  if (inspected.format === "webp") return stripWebp(inspected, selectedIds);
  return null;
}

export const GROUP_LABELS = {
  location: "Location",
  when: "Date",
  device: "Device",
  makernote: "Camera internals",
  author: "Author and contact",
  document: "Document and publishing",
};

export const GROUP_EMOJI = {
  location: "📍",
  when: "📅",
  device: "📷",
  makernote: "🔧",
  author: "👤",
  document: "📄",
};

export const SUMMARY_GROUPS = ["location", "when", "device"];

export const GROUP_ORDER = ["location", "when", "device", "makernote", "author", "document"];
