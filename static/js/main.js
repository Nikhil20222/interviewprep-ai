/* InterviewPrep AI - Phase 1 frontend
   Handles resume upload, sends it to the server, shows the result. */

(function () {
  "use strict";

  const ALLOWED_TYPES = ["pdf", "docx", "txt"];
  const MAX_SIZE_MB = 5;

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const browseBtn = document.getElementById("browse-btn");
  const dropzoneContent = document.getElementById("dropzone-content");
  const fileInfo = document.getElementById("file-info");
  const fileNameEl = document.getElementById("file-name");
  const removeFileBtn = document.getElementById("remove-file-btn");
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorBox = document.getElementById("error-message");
  const resultBox = document.getElementById("result");

  let selectedFile = null;

  const ICONS = {
    user: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/>',
    tag: '<path d="M3 8V4a1 1 0 0 1 1-1h4l9 9-5 5-9-9Z"/><circle cx="6.5" cy="6.5" r="1"/>',
    book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z"/><path d="M8 4v13"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="M9 12.5 7 21l5-3 5 3-2-8.5"/>',
    star: '<path d="M12 2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17l-6 3.4L7.3 13.7l-5-4.7 6.8-.8Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  };

  function icon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.tag}</svg>`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function getExtension(name) {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }

  function validateFile(file) {
    const ext = getExtension(file.name);
    if (!ALLOWED_TYPES.includes(ext)) {
      return `Unsupported file type. Allowed types: ${ALLOWED_TYPES.join(", ").toUpperCase()}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }

  function renderTags(items) {
    if (!items || items.length === 0) return '<p class="empty-note">Not Found</p>';
    return `<div class="tag-list">${items.map((i) => `<span class="tag">${escapeHtml(i)}</span>`).join("")}</div>`;
  }

  /* ---- File selection ---- */

  function selectFile(file) {
    clearError();
    const err = validateFile(file);
    if (err) {
      showError(err);
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileInfo.hidden = false;
    dropzoneContent.style.display = "none";
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.hidden = true;
    dropzoneContent.style.display = "flex";
    clearError();
  }

  browseBtn.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("click", (e) => {
    if (e.target === dropzone || dropzoneContent.contains(e.target)) fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) selectFile(fileInput.files[0]);
  });
  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files.length > 0) selectFile(e.dataTransfer.files[0]);
  });
  removeFileBtn.addEventListener("click", clearFile);

  /* ---- Upload + analyze ---- */

  analyzeBtn.addEventListener("click", uploadFile);

  async function uploadFile() {
    if (!selectedFile) {
      showError("Please select a file first.");
      return;
    }

    clearError();
    fileInfo.hidden = true;
    loadingIndicator.hidden = false;
    resultBox.hidden = true;

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      const response = await fetch("/api/analyze-resume", { method: "POST", body: formData });
      const data = await response.json();
      loadingIndicator.hidden = true;

      if (!response.ok || !data.success) {
        fileInfo.hidden = false;
        showError(data.error || "Something went wrong while analyzing your resume.");
        return;
      }

      showResult(data);
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
      clearFile();
    } catch (err) {
      loadingIndicator.hidden = true;
      fileInfo.hidden = false;
      showError("Could not reach the server. Please try again.");
    }
  }

  /* ---- Render everything ---- */

  function showResult(data) {
    const banner = document.getElementById("ai-warning-banner");
    if (data.parsed_data && data.parsed_data._ai_warning || data.insights_warning) {
      const parts = [];
      if (data.parsed_data && data.parsed_data._ai_warning) parts.push(data.parsed_data._ai_warning);
      if (data.insights_warning) parts.push(data.insights_warning);
      banner.innerHTML = `⚠ AI analysis had a problem: ${escapeHtml(parts.join(" | "))}. Some content below may be incomplete.`;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }

    showStats(data.stats);
    showPreview(data.parsed_data);
    showScores(data.analysis);
    showChecklist(data.checklist);
    showAtsBreakdown(data.ats);
    showSuggestions(data.suggestions);
  }

  function showStats(stats) {
    const row = document.getElementById("stats-row");
    const items = [
      ["Word Count", stats.word_count],
      ["Character Count", stats.char_count],
      ["Pages", stats.pages],
      ["Skills Found", stats.skills_found],
      ["Projects Found", stats.projects_found],
      ["Education Found", stats.education_found],
      ["Experience Found", stats.experience_found],
    ];
    row.innerHTML = items
      .map(([label, value]) => `<div class="stat-box"><div class="stat-number">${value}</div><div class="stat-label">${label}</div></div>`)
      .join("");
  }

  function showPreview(p) {
    const grid = document.getElementById("preview-grid");
    grid.innerHTML = "";

    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("user")} Personal Information</div>
        ${["full_name", "email", "phone", "linkedin", "github", "portfolio"]
          .map((key) => {
            const labels = { full_name: "Full Name", email: "Email", phone: "Phone", linkedin: "LinkedIn", github: "GitHub", portfolio: "Portfolio" };
            return `<div class="info-row"><span class="label">${labels[key]}</span><span class="value">${escapeHtml(p[key])}</span></div>`;
          })
          .join("")}
      </div>`;

    grid.innerHTML += `<div class="info-card"><div class="info-card-title">${icon("tag")} Skills</div>${renderTags(p.skills)}</div>`;
    grid.innerHTML += `<div class="info-card"><div class="info-card-title">${icon("tag")} Programming Languages</div>${renderTags(p.programming_languages)}</div>`;

    const frameworksTools = [...(p.frameworks || []), ...(p.tools || [])];
    grid.innerHTML += `<div class="info-card"><div class="info-card-title">${icon("tag")} Frameworks &amp; Tools</div>${renderTags(frameworksTools)}</div>`;

    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("book")} Education</div>
        ${
          p.education && p.education.length
            ? p.education.map((e) => `<div class="entry-block"><div class="entry-title">${escapeHtml(e.degree || "Not Found")}</div><div class="entry-subtitle">${escapeHtml(e.institution || "Not Found")}${e.year ? " · " + escapeHtml(e.year) : ""}</div></div>`).join("")
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("briefcase")} Work Experience</div>
        ${
          p.work_experience && p.work_experience.length
            ? p.work_experience.map((e) => `<div class="entry-block"><div class="entry-title">${escapeHtml(e.title || "Not Found")}</div><div class="entry-subtitle">${escapeHtml(e.company || "Not Found")}${e.duration ? " · " + escapeHtml(e.duration) : ""}</div>${e.description ? `<div class="entry-desc">${escapeHtml(e.description)}</div>` : ""}</div>`).join("")
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("folder")} Projects</div>
        ${
          p.projects && p.projects.length
            ? p.projects.map((e) => `<div class="entry-block"><div class="entry-title">${escapeHtml(e.name || "Not Found")}</div>${e.technologies ? `<div class="entry-subtitle">${escapeHtml(e.technologies)}</div>` : ""}${e.description ? `<div class="entry-desc">${escapeHtml(e.description)}</div>` : ""}</div>`).join("")
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    grid.innerHTML += `<div class="info-card"><div class="info-card-title">${icon("award")} Certifications</div>${renderTags(p.certifications)}</div>`;

    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("star")} Achievements</div>
        ${
          p.achievements && p.achievements.length
            ? `<ul class="list-plain">${p.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    grid.innerHTML += `<div class="info-card"><div class="info-card-title">${icon("globe")} Languages</div>${renderTags(p.languages)}</div>`;
  }

  function showScores(analysis) {
    const banner = document.getElementById("score-banner");
    banner.innerHTML = `
      <span class="score-number">${analysis.overall_score}</span>
      <span class="score-out-of">/ 100</span>
      <span class="score-label">Overall Resume Score</span>
    `;

    const grid = document.getElementById("analyzer-grid");
    grid.innerHTML = analysis.cards
      .filter((c) => c.key !== "overall_score")
      .map(
        (c) => `
      <div class="score-card">
        <div class="score-card-header">
          <span class="score-card-label">${escapeHtml(c.label)}</span>
          <span class="score-card-value">${c.score}</span>
        </div>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${c.score}%"></div></div>
        <p class="score-card-explanation">${escapeHtml(c.explanation)}</p>
      </div>`
      )
      .join("");
  }

  function showChecklist(checklist) {
    const box = document.getElementById("checklist");
    box.innerHTML = checklist
      .map(
        (item) => `
      <div class="checklist-row">
        <span class="checklist-mark ${item.passed ? "pass" : "fail"}">${item.passed ? "✓" : "✗"}</span>
        <span class="checklist-label">${escapeHtml(item.label)}</span>
        <span class="checklist-reason">${escapeHtml(item.reason)}</span>
      </div>`
      )
      .join("");
  }

  function statusClass(status) {
    if (status === "Good") return "status-good";
    if (status === "Missing") return "status-missing";
    return "status-needs-improvement";
  }

  function showAtsBreakdown(ats) {
    const banner = document.getElementById("ats-score-banner");
    banner.innerHTML = `
      <span class="score-number">${ats.overall_ats_score}</span>
      <span class="score-out-of">/ 100</span>
      <span class="score-label">Overall ATS Score</span>
    `;

    const missing = ats.sections.filter((s) => s.status === "Missing");
    const missingBox = document.getElementById("missing-sections");
    missingBox.innerHTML = missing.length
      ? `<ul class="list-plain">${missing.map((s) => `<li>${escapeHtml(s.label)} — ${escapeHtml(s.note)}</li>`).join("")}</ul>`
      : '<p class="empty-note">No sections flagged as missing.</p>';

    const list = document.getElementById("ats-list");
    list.innerHTML = ats.sections
      .map(
        (s) => `
      <div class="ats-row">
        <span class="ats-row-label">${escapeHtml(s.label)}</span>
        <span class="ats-row-note">${escapeHtml(s.note)}</span>
        <span class="status-badge ${statusClass(s.status)}">${escapeHtml(s.status)}</span>
      </div>`
      )
      .join("");
  }

  function showSuggestions(suggestions) {
    const container = document.getElementById("suggestion-groups");

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<p class="empty-note">No specific suggestions found — your resume looks solid on the points we checked.</p>';
      return;
    }

    // Group suggestions by category so related feedback stays together
    const groups = {};
    suggestions.forEach((s) => {
      const key = s.category || "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    container.innerHTML = Object.keys(groups)
      .map((category) => {
        const cards = groups[category]
          .map(
            (s, index) => `
          <div class="suggestion-card">
            <div class="suggestion-text-block suggestion-current">${escapeHtml(s.current_text)}</div>
            <div class="suggestion-arrow">&darr;</div>
            <div class="suggestion-text-block suggestion-improved">
              <span>${escapeHtml(s.suggested_text)}</span>
              <button type="button" class="btn-copy" data-category="${escapeHtml(category)}" data-index="${index}">Copy</button>
            </div>
            ${s.reason ? `<p class="suggestion-reason">${escapeHtml(s.reason)}</p>` : ""}
          </div>`
          )
          .join("");
        return `<h3 class="suggestion-group-title">${escapeHtml(category)}</h3>${cards}`;
      })
      .join("");

    container.querySelectorAll(".btn-copy").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const category = btn.getAttribute("data-category");
        const idx = Number(btn.getAttribute("data-index"));
        const text = groups[category][idx].suggested_text;
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "Copied";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 1500);
        } catch (err) {
          btn.textContent = "Failed";
        }
      });
    });
  }
})();
