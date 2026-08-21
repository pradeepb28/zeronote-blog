import { GROUP_EMOJI, GROUP_LABELS, GROUP_ORDER, SUMMARY_GROUPS, inspectPhoto, stripPhoto } from "./exif/core.js";

(function () {
  const root = document.getElementById("tool-root");
  if (!root) return;

  const resultEl = document.getElementById("exif-result");
  const thumb = document.getElementById("exif-thumb");
  const nameEl = document.getElementById("exif-name");
  const statusEl = document.getElementById("exif-status");
  const summaryEl = document.getElementById("exif-summary");
  const noteEl = document.getElementById("exif-note");
  const fileInput = document.getElementById("exif-file");
  const fieldsEl = document.getElementById("exif-fields");
  const actionsEl = document.getElementById("exif-actions");
  const removeBtn = document.getElementById("exif-remove");
  const downloadBtn = document.getElementById("exif-download");
  const drop = document.getElementById("exif-drop");

  if (
    !resultEl ||
    !thumb ||
    !nameEl ||
    !statusEl ||
    !summaryEl ||
    !noteEl ||
    !fileInput ||
    !fieldsEl ||
    !actionsEl ||
    !removeBtn ||
    !downloadBtn ||
    !drop
  ) {
    return;
  }

  let inspected = null;
  let fileName = "photo";
  let currentFile = null;
  let cleaned = null;
  let cleanedName = "";
  let thumbUrl = null;

  function selectedIds() {
    return Array.from(fieldsEl.querySelectorAll("input[type='checkbox']:checked")).map(
      (el) => el.value
    );
  }

  function renderFields(fields) {
    fieldsEl.innerHTML = "";
    if (!fields || !fields.length) {
      fieldsEl.hidden = true;
      return;
    }

    GROUP_ORDER.forEach((group) => {
      const rows = fields.filter((f) => f.group === group);
      if (!rows.length) return;
      const wrap = document.createElement("div");
      wrap.className = "tool-field-group";
      const heading = document.createElement("p");
      heading.className = "tool-label";
      heading.textContent = `${GROUP_EMOJI[group] || ""} ${GROUP_LABELS[group]}`.trim();
      wrap.appendChild(heading);
      rows.forEach((field) => {
        const label = document.createElement("label");
        label.className = "tool-check";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = true;
        input.value = field.id;
        const text = document.createTextNode(`${field.label}: ${field.value}`);
        label.appendChild(input);
        label.appendChild(text);
        wrap.appendChild(label);
      });
      fieldsEl.appendChild(wrap);
    });

    fieldsEl.hidden = false;
  }

  function setThumb(file) {
    if (thumbUrl) {
      URL.revokeObjectURL(thumbUrl);
      thumbUrl = null;
    }
    thumb.removeAttribute("src");
    thumb.hidden = true;
    if (!file) return;
    thumbUrl = URL.createObjectURL(file);
    thumb.alt = file.name || "Selected photo";
    thumb.onload = function () {
      thumb.hidden = false;
    };
    thumb.onerror = function () {
      thumb.hidden = true;
    };
    thumb.src = thumbUrl;
  }

  function renderSummary(fields, visible) {
    summaryEl.innerHTML = "";
    if (!visible) {
      summaryEl.hidden = true;
      return;
    }
    SUMMARY_GROUPS.forEach((group) => {
      const rows = (fields || []).filter((f) => f.group === group);
      const value = rows.length ? rows.map((f) => f.value).join(", ") : "None";
      const li = document.createElement("li");
      const emoji = document.createElement("span");
      emoji.className = "tool-summary-emoji";
      emoji.textContent = GROUP_EMOJI[group];
      emoji.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "tool-summary-label";
      label.textContent = GROUP_LABELS[group];
      const val = document.createElement("span");
      val.className = "tool-summary-value";
      val.textContent = value;
      li.appendChild(emoji);
      li.appendChild(label);
      li.appendChild(val);
      summaryEl.appendChild(li);
    });
    summaryEl.hidden = false;
  }

  function renderState({
    name,
    status,
    note,
    fields,
    showSummary,
    showRemove,
    showDownload,
    downloadEnabled,
  }) {
    if (!status) {
      resultEl.hidden = true;
      actionsEl.hidden = true;
      removeBtn.hidden = true;
      downloadBtn.hidden = true;
      renderFields([]);
      renderSummary([], false);
      return;
    }

    resultEl.hidden = false;
    nameEl.textContent = name || "";
    nameEl.title = name || "";
    statusEl.textContent = status;
    noteEl.textContent = note || "";
    noteEl.hidden = !note;
    renderSummary(fields || [], showSummary);
    renderFields(fields || []);

    removeBtn.hidden = !showRemove;
    downloadBtn.hidden = !showDownload;
    downloadBtn.disabled = !downloadEnabled;
    actionsEl.hidden = !showRemove && !showDownload;
  }

  function idle() {
    inspected = null;
    currentFile = null;
    cleaned = null;
    cleanedName = "";
    setThumb(null);
    renderState({});
  }

  async function loadFile(file) {
    inspected = null;
    cleaned = null;
    cleanedName = "";
    currentFile = file;
    fileName = file.name || "photo";
    setThumb(file);

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const result = inspectPhoto(bytes);

    if (!result || result.error) {
      renderState({
        name: fileName,
        status: result && result.kind === "heic" ? "Not supported" : "Could not read",
        note: (result && result.error) || "Could not read this file.",
      });
      return;
    }

    inspected = result;
    if (!result.fields.length) {
      renderState({
        name: fileName,
        status: "No identifying metadata",
        showSummary: true,
      });
      return;
    }

    renderState({
      name: fileName,
      status: "Identifying metadata found",
      note: "Uncheck a field to keep it.",
      fields: result.fields,
      showSummary: true,
      showRemove: true,
      showDownload: true,
      downloadEnabled: false,
    });
  }

  function cleanedFileName(original, format) {
    const base = original.replace(/\.[^.]+$/, "") || "photo";
    const ext = format === "png" ? ".png" : format === "webp" ? ".webp" : ".jpg";
    return `${base}-cleaned${ext}`;
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) loadFile(file);
  });

  drop.addEventListener("click", (event) => {
    if (event.target === fileInput || event.target.closest("label[for='exif-file']")) return;
    fileInput.click();
  });

  let dragDepth = 0;

  function hasFiles(event) {
    const types = event.dataTransfer && event.dataTransfer.types;
    return types && Array.from(types).includes("Files");
  }

  drop.addEventListener("dragenter", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth += 1;
    drop.classList.add("is-drop");
  });

  drop.addEventListener("dragover", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  drop.addEventListener("dragleave", (event) => {
    if (!hasFiles(event)) return;
    dragDepth -= 1;
    if (dragDepth <= 0) {
      dragDepth = 0;
      drop.classList.remove("is-drop");
    }
  });

  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    drop.classList.remove("is-drop");
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  removeBtn.addEventListener("click", () => {
    if (!inspected) return;
    const ids = selectedIds();
    if (!ids.length) {
      noteEl.hidden = false;
      noteEl.textContent = "Select at least one field to remove.";
      return;
    }
    const bytes = stripPhoto(inspected, ids);
    if (!bytes) {
      renderState({
        name: fileName,
        status: "Could not write",
        note: "Could not write a cleaned file.",
      });
      return;
    }
    cleaned = bytes;
    cleanedName = cleanedFileName(fileName, inspected.format);
    const next = inspectPhoto(bytes);
    inspected = next.error ? inspected : next;
    const leftover = (next.fields && next.fields.length) || 0;
    if (leftover) {
      renderState({
        name: fileName,
        status: "Some identifying metadata remains",
        note: "Uncheck a field to keep it.",
        fields: next.fields,
        showSummary: true,
        showRemove: true,
        showDownload: true,
        downloadEnabled: true,
      });
      return;
    }
    renderState({
      name: fileName,
      status: "Metadata removed",
      note: "Download a copy. The original file is unchanged.",
      showSummary: true,
      showDownload: true,
      downloadEnabled: true,
    });
  });

  downloadBtn.addEventListener("click", () => {
    if (!cleaned) return;
    const type =
      inspected && inspected.format === "png"
        ? "image/png"
        : inspected && inspected.format === "webp"
          ? "image/webp"
          : "image/jpeg";
    const blob = new Blob([cleaned], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = cleanedName || "photo-cleaned.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  idle();
})();
