import { cleanLink } from "./trackers/rules.js";

(function () {
  const root = document.getElementById("tool-root");
  if (!root) return;

  const input = document.getElementById("link-tracker-remover-input");
  const output = document.getElementById("link-tracker-remover-output");
  const note = document.getElementById("link-tracker-remover-note");
  const copyBtn = document.getElementById("link-tracker-remover-copy");

  if (!input || !output || !note || !copyBtn) return;

  const EMPTY = "Cleaned link will appear here";

  function copyText(text) {
    const done = () => {
      const label = copyBtn.textContent;
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = label;
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

  function setNote(text) {
    if (!text) {
      note.hidden = true;
      note.textContent = "";
      return;
    }
    note.hidden = false;
    note.textContent = text;
  }

  function setEmpty(message) {
    output.textContent = message || EMPTY;
    copyBtn.disabled = true;
    setNote("");
  }

  function render() {
    const result = cleanLink(input.value);
    if (result.empty) {
      setEmpty();
      return;
    }
    if (result.error) {
      setEmpty(result.error);
      return;
    }

    output.textContent = result.href;
    copyBtn.disabled = false;

    if (result.removed.length) {
      setNote("Removed: " + result.removed.join(", "));
      return;
    }
    if (result.unwrapped) {
      setNote("Removed tracking redirect.");
      return;
    }
    setNote("No trackers found.");
  }

  copyBtn.addEventListener("click", () => {
    const value = output.textContent.trim();
    if (!value || value === EMPTY || copyBtn.disabled) return;
    copyText(value);
  });

  input.addEventListener("input", render);
  setEmpty();
})();
