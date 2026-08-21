import wordlist from "./wordlist.json";

(function () {
  const root = document.getElementById("tool-root");
  if (!root) return;

  const words = Array.isArray(wordlist) ? wordlist : [];
  const output = document.getElementById("passphrase-output");
  const countInput = document.getElementById("passphrase-words");
  const countValue = document.getElementById("passphrase-words-value");
  const separator = document.getElementById("passphrase-separator");
  const capitals = document.getElementById("passphrase-capitals");
  const numbers = document.getElementById("passphrase-numbers");
  const generateBtn = document.getElementById("passphrase-generate");
  const copyBtn = document.getElementById("passphrase-copy");

  if (!output || !countInput || !separator || !generateBtn || !copyBtn || words.length < 8) return;

  function randomInt(max) {
    const range = 0x100000000;
    const limit = range - (range % max);
    const buf = new Uint32Array(1);
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % max;
  }

  function titleCase(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function pickWords(count) {
    const chosen = [];
    const used = new Set();
    while (chosen.length < count) {
      const word = words[randomInt(words.length)];
      if (used.has(word)) continue;
      used.add(word);
      chosen.push(word);
    }
    return chosen;
  }

  function generatePassphrase() {
    const count = Number(countInput.value);
    const sep = separator.value === "_" ? "_" : "-";
    let parts = pickWords(count);
    if (capitals.checked) {
      parts = parts.map(titleCase);
    }
    let phrase = parts.join(sep);
    if (numbers.checked) {
      const n = randomInt(100);
      phrase += sep + String(n).padStart(2, "0");
    }
    return phrase;
  }

  function render() {
    countValue.textContent = countInput.value;
    output.textContent = generatePassphrase();
  }

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

  countInput.addEventListener("input", render);
  separator.addEventListener("change", render);
  capitals.addEventListener("change", render);
  numbers.addEventListener("change", render);
  generateBtn.addEventListener("click", render);
  copyBtn.addEventListener("click", () => {
    const value = output.textContent.trim();
    if (value) copyText(value);
  });

  render();
})();
