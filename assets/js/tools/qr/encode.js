import { qrcodegen } from "./qrcodegen.js";

export function encodeQR(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const seg = qrcodegen.QrSegment.makeBytes(bytes);
  const qr = qrcodegen.QrCode.encodeSegments(
    [seg],
    qrcodegen.QrCode.Ecc.MEDIUM,
    1,
    40,
    -1,
    false
  );
  const size = qr.size;
  const modules = new Array(size);
  for (let y = 0; y < size; y += 1) {
    const row = new Array(size);
    for (let x = 0; x < size; x += 1) {
      row[x] = qr.getModule(x, y) ? 1 : 0;
    }
    modules[y] = row;
  }
  return modules;
}
