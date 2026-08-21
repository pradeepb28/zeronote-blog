import { encodeQR } from "./qr/encode.js";

(function () {
  const root = document.getElementById("tool-root");
  if (!root) return;

  const ssidInput = document.getElementById("wifi-qr-ssid");
  const passwordInput = document.getElementById("wifi-qr-password");
  const securityInput = document.getElementById("wifi-qr-security");
  const showInput = document.getElementById("wifi-qr-show");
  const hiddenInput = document.getElementById("wifi-qr-hidden");
  const empty = document.getElementById("wifi-qr-empty");
  const canvas = document.getElementById("wifi-qr-canvas");
  const copyBtn = document.getElementById("wifi-qr-copy");
  const downloadBtn = document.getElementById("wifi-qr-download");

  if (
    !ssidInput ||
    !passwordInput ||
    !securityInput ||
    !showInput ||
    !hiddenInput ||
    !empty ||
    !canvas ||
    !copyBtn ||
    !downloadBtn
  ) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const QUIET = 4;
  const TARGET = 264;
  let pngBlob = null;

  function escapeWifi(value) {
    return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/:/g, "\\:");
  }

  function wifiPayload(ssid, password, type, hidden) {
    const s = escapeWifi(ssid);
    const h = hidden ? "true" : "false";
    if (type === "nopass") {
      return `WIFI:T:nopass;S:${s};H:${h};;`;
    }
    return `WIFI:T:${type};S:${s};P:${escapeWifi(password)};H:${h};;`;
  }

  function filenameFromSsid(ssid) {
    const slug = ssid
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return slug ? `wifi-${slug}.png` : "wifi.png";
  }

  function setCopied(button) {
    const label = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = label;
    }, 1500);
  }

  function canvasToBlob() {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  function setEmpty(message) {
    pngBlob = null;
    canvas.hidden = true;
    empty.hidden = false;
    empty.textContent = message || "QR code will appear here";
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
  }

  function drawModules(modules) {
    const size = modules.length;
    const modulePx = Math.max(3, Math.floor(TARGET / (size + QUIET * 2)));
    const px = (size + QUIET * 2) * modulePx;
    canvas.width = px;
    canvas.height = px;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = "#000";
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (!modules[r][c]) continue;
        ctx.fillRect((c + QUIET) * modulePx, (r + QUIET) * modulePx, modulePx, modulePx);
      }
    }
  }

  function render() {
    const open = securityInput.value === "nopass";
    passwordInput.disabled = open;
    passwordInput.type = showInput.checked ? "text" : "password";

    const ssid = ssidInput.value;
    if (!ssid) {
      setEmpty();
      return;
    }

    try {
      const payload = wifiPayload(ssid, open ? "" : passwordInput.value, securityInput.value, hiddenInput.checked);
      const modules = encodeQR(payload);
      drawModules(modules);
      canvas.hidden = false;
      empty.hidden = true;
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      pngBlob = null;
      canvasToBlob().then((blob) => {
        pngBlob = blob;
      });
    } catch {
      setEmpty("Could not create a QR code from this network name.");
    }
  }

  copyBtn.addEventListener("click", async () => {
    if (copyBtn.disabled) return;
    const blob = pngBlob || (await canvasToBlob());
    if (!blob || !navigator.clipboard || typeof ClipboardItem === "undefined") return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(copyBtn);
    } catch {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": Promise.resolve(blob),
          }),
        ]);
        setCopied(copyBtn);
      } catch {
        /* Download still works. */
      }
    }
  });

  downloadBtn.addEventListener("click", async () => {
    if (downloadBtn.disabled) return;
    const blob = pngBlob || (await canvasToBlob());
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filenameFromSsid(ssidInput.value);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  ssidInput.addEventListener("input", render);
  passwordInput.addEventListener("input", render);
  securityInput.addEventListener("change", render);
  showInput.addEventListener("change", render);
  hiddenInput.addEventListener("change", render);

  setEmpty();
})();
