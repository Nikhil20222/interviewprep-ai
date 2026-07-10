

(function () {
  "use strict";

  const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
  const MAX_SIZE_MB = 5; 

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const browseBtn = document.getElementById("browse-btn");
  const fileInfo = document.getElementById("file-info");
  const fileNameEl = document.getElementById("file-name");
  const removeFileBtn = document.getElementById("remove-file-btn");
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorMessage = document.getElementById("error-message");
  const dropzoneContent = document.getElementById("dropzone-content");
  const resultsSection = document.getElementById("results-section");

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


  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
  }

  function getExtension(filename) {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }

  function validateClientSide(file) {
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderTags(items) {
    if (!items || items.length === 0) {
      return '<p class="empty-note">Not Found</p>';
    }
    return `<div class="tag-list">${items.map((i) => `<span class="tag">${escapeHtml(i)}</span>`).join("")}</div>`;
  }

 

  function handleFileSelected(file) {
    clearError();
    const validationError = validateClientSide(file);
    if (validationError) {
      showError(validationError);
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileInfo.hidden = false;
    dropzoneContent.style.display = "none";
  }

  function resetUpload() {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.hidden = true;
    dropzoneContent.style.display = "flex";
    clearError();
  }

  browseBtn.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("click", (e) => {
    if (e.target === dropzone || dropzoneContent.contains(e.target)) {
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  removeFileBtn.addEventListener("click", resetUpload);



  analyzeBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      showError("Please select a file first.");
      return;
    }

    clearError();
    fileInfo.hidden = true;
    loadingIndicator.hidden = false;
    resultsSection.hidden = true;

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      loadingIndicator.hidden = true;

      if (!response.ok || !data.success) {
        fileInfo.hidden = false;
        showError(data.error || "Something went wrong while analyzing your resume.");
        return;
      }

      renderResults(data);
      resultsSection.hidden = false;
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

      
      resetUpload();
    } catch (err) {
      loadingIndicator.hidden = true;
      fileInfo.hidden = false;
      showError("Could not reach the server. Please try again.");
    }
  });

  function renderResults(data) {
    renderPreview(data.parsed_data);
    renderAnalyzer(data.analysis);
    renderAts(data.ats);
    renderSuggestions(data.suggestions);
  }

  function renderPreview(p) {
    const grid = document.getElementById("preview-grid");
    grid.innerHTML = "";

    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("user")} Personal Information</div>
        ${["full_name", "email", "phone", "linkedin", "github", "portfolio"]
          .map((key) => {
            const labels = {
              full_name: "Full Name",
              email: "Email",
              phone: "Phone",
              linkedin: "LinkedIn",
              github: "GitHub",
              portfolio: "Portfolio",
            };
            return `<div class="info-row"><span class="label">${labels[key]}</span><span class="value">${escapeHtml(p[key])}</span></div>`;
          })
          .join("")}
      </div>`;

   
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("tag")} Skills</div>
        ${renderTags(p.skills)}
      </div>`;

    
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("tag")} Programming Languages</div>
        ${renderTags(p.programming_languages)}
      </div>`;

    
    const frameworksTools = [...(p.frameworks || []), ...(p.tools || [])];
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("tag")} Frameworks &amp; Tools</div>
        ${renderTags(frameworksTools)}
      </div>`;

 
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("book")} Education</div>
        ${
          p.education && p.education.length
            ? p.education
                .map(
                  (e) => `
          <div class="entry-block">
            <div class="entry-title">${escapeHtml(e.degree || "Not Found")}</div>
            <div class="entry-subtitle">${escapeHtml(e.institution || "Not Found")}${e.year ? " · " + escapeHtml(e.year) : ""}</div>
          </div>`
                )
                .join("")
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    // Experience
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("briefcase")} Work Experience</div>
        ${
          p.work_experience && p.work_experience.length
            ? p.work_experience
                .map(
                  (e) => `
          <div class="entry-block">
            <div class="entry-title">${escapeHtml(e.title || "Not Found")}</div>
            <div class="entry-subtitle">${escapeHtml(e.company || "Not Found")}${e.duration ? " · " + escapeHtml(e.duration) : ""}</div>
            ${e.description ? `<div class="entry-desc">${escapeHtml(e.description)}</div>` : ""}
          </div>`
                )
                .join("")
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    // Projects
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("folder")} Projects</div>
        ${
          p.projects && p.projects.length
            ? p.projects
                .map(
                  (e) => `
          <div class="entry-block">
            <div class="entry-title">${escapeHtml(e.name || "Not Found")}</div>
            ${e.technologies ? `<div class="entry-subtitle">${escapeHtml(e.technologies)}</div>` : ""}
            ${e.description ? `<div class="entry-desc">${escapeHtml(e.description)}</div>` : ""}
          </div>`
                )
                .join("")
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    // Certifications
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("award")} Certifications</div>
        ${renderTags(p.certifications)}
      </div>`;

    // Achievements
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("star")} Achievements</div>
        ${
          p.achievements && p.achievements.length
            ? `<ul style="padding-left:18px;">${p.achievements.map((a) => `<li class="entry-desc">${escapeHtml(a)}</li>`).join("")}</ul>`
            : '<p class="empty-note">Not Found</p>'
        }
      </div>`;

    // Languages
    grid.innerHTML += `
      <div class="info-card">
        <div class="info-card-title">${icon("globe")} Languages</div>
        ${renderTags(p.languages)}
      </div>`;
  }

  /* ---------------- Rendering: Analyzer ---------------- */

  function renderAnalyzer(analysis) {
    const banner = document.getElementById("overall-score-banner");
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

  /* ---------------- Rendering: ATS ---------------- */

  function statusClass(status) {
    if (status === "Good") return "status-good";
    if (status === "Missing") return "status-missing";
    return "status-needs-improvement";
  }

  function renderAts(ats) {
    const banner = document.getElementById("ats-overall-banner");
    banner.innerHTML = `
      <span class="score-number">${ats.overall_ats_score}</span>
      <span class="score-out-of">/ 100</span>
      <span class="score-label">Overall ATS Score</span>
    `;

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

  /* ---------------- Rendering: Suggestions ---------------- */

  function renderSuggestions(suggestions) {
    const list = document.getElementById("suggestions-list");

    if (!suggestions || suggestions.length === 0) {
      list.innerHTML = '<p class="empty-note">No specific suggestions found — your resume looks solid on the points we checked.</p>';
      return;
    }

    list.innerHTML = suggestions
      .map(
        (s, index) => `
      <div class="suggestion-card">
        <span class="suggestion-category">${escapeHtml(s.category)}</span>
        <div class="suggestion-text-block suggestion-current">${escapeHtml(s.current_text)}</div>
        <div class="suggestion-arrow">&darr;</div>
        <div class="suggestion-text-block suggestion-improved">
          <span>${escapeHtml(s.suggested_text)}</span>
          <button type="button" class="btn-copy" data-index="${index}">Copy</button>
        </div>
        ${s.reason ? `<p class="suggestion-reason">${escapeHtml(s.reason)}</p>` : ""}
      </div>`
      )
      .join("");

    list.querySelectorAll(".btn-copy").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idx = Number(btn.getAttribute("data-index"));
        const text = suggestions[idx].suggested_text;
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
