(function () {
  const root = document.getElementById("tool-root");
  if (!root) return;

  const output = document.getElementById("password-output");
  const lengthInput = document.getElementById("password-length");
  const lengthValue = document.getElementById("password-length-value");
  const capitals = document.getElementById("password-capitals");
  const numbers = document.getElementById("password-numbers");
  const symbols = document.getElementById("password-symbols");
  const generateBtn = document.getElementById("password-generate");
  const copyBtn = document.getElementById("password-copy");

  if (!output || !lengthInput || !generateBtn || !copyBtn) return;

  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const DIGITS = "0123456789";
  const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

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

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    return items;
  }

  function generatePassword() {
    const length = Number(lengthInput.value);
    const pools = [LOWER];
    if (capitals.checked) pools.push(UPPER);
    if (numbers.checked) pools.push(DIGITS);
    if (symbols.checked) pools.push(SYMBOLS);

    const all = pools.join("");
    const chars = [];

    pools.forEach((pool) => {
      chars.push(pool[randomInt(pool.length)]);
    });

    while (chars.length < length) {
      chars.push(all[randomInt(all.length)]);
    }

    return shuffle(chars).slice(0, length).join("");
  }

  function render() {
    lengthValue.textContent = lengthInput.value;
    output.textContent = generatePassword();
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

  lengthInput.addEventListener("input", render);
  capitals.addEventListener("change", render);
  numbers.addEventListener("change", render);
  symbols.addEventListener("change", render);
  generateBtn.addEventListener("click", render);
  copyBtn.addEventListener("click", () => {
    const value = output.textContent.trim();
    if (value) copyText(value);
  });

  render();
})();
