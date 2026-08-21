import { md5 } from "./hash/md5.js";

(function () {
  const root = document.getElementById("tool-root");
  if (!root) return;

  const input = document.getElementById("hash-input");
  const rows = [
    { id: "md5", output: document.getElementById("hash-md5"), copy: document.getElementById("hash-copy-md5") },
    { id: "sha1", output: document.getElementById("hash-sha1"), copy: document.getElementById("hash-copy-sha1") },
    { id: "sha256", output: document.getElementById("hash-sha256"), copy: document.getElementById("hash-copy-sha256") },
  ];

  if (!input || rows.some((row) => !row.output || !row.copy)) return;

  const EMPTY = "Hash will appear here";
  const encoder = new TextEncoder();
  let seq = 0;

  function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function copyText(button, text) {
    const done = () => {
      const label = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = label;
      }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
      return;
    }
    fallback();

    function fallback() {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        done();
      } finally {
        document.body.removeChild(area);
      }
    }
  }

  function setEmpty() {
    rows.forEach((row) => {
      row.output.textContent = EMPTY;
      row.copy.disabled = true;
    });
  }

  function setRow(row, value) {
    row.output.textContent = value;
    row.copy.disabled = !value;
  }

  async function digest(algo, data) {
    const buf = await crypto.subtle.digest(algo, data);
    return toHex(buf);
  }

  async function render() {
    const id = ++seq;
    const text = input.value;
    if (!text) {
      setEmpty();
      return;
    }

    const data = encoder.encode(text);
    const md5Hex = md5(data);
    if (id !== seq) return;
    setRow(rows[0], md5Hex);

    try {
      const sha1 = await digest("SHA-1", data);
      const sha256 = await digest("SHA-256", data);
      if (id !== seq) return;
      setRow(rows[1], sha1);
      setRow(rows[2], sha256);
    } catch {
      if (id !== seq) return;
      setRow(rows[1], "");
      setRow(rows[2], "");
      rows[1].output.textContent = "Could not compute this hash in this browser.";
      rows[2].output.textContent = "Could not compute this hash in this browser.";
    }
  }

  rows.forEach((row) => {
    row.copy.addEventListener("click", () => {
      const value = row.output.textContent.trim();
      if (!value || value === EMPTY || row.copy.disabled) return;
      copyText(row.copy, value);
    });
  });

  input.addEventListener("input", render);
  setEmpty();
})();
