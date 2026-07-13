

(function () {
  "use strict";

  const ALLOWED_TYPES = ["pdf", "docx", "txt"];
  const MAX_SIZE_MB = 5;

  const resumeDropzone = document.getElementById("resume-dropzone");
  const resumeFileInput = document.getElementById("resume-file-input");
  const resumeBrowseBtn = document.getElementById("resume-browse-btn");
  const resumeDropzoneContent = document.getElementById("resume-dropzone-content");
  const resumeFileInfo = document.getElementById("resume-file-info");
  const resumeFileName = document.getElementById("resume-file-name");
  const removeResumeBtn = document.getElementById("remove-resume-btn");

  const jdTabUploadBtn = document.getElementById("jd-tab-upload-btn");
  const jdTabPasteBtn = document.getElementById("jd-tab-paste-btn");
  const jdPanelUpload = document.getElementById("jd-panel-upload");
  const jdPanelPaste = document.getElementById("jd-panel-paste");

  const jdDropzone = document.getElementById("jd-dropzone");
  const jdFileInput = document.getElementById("jd-file-input");
  const jdBrowseBtn = document.getElementById("jd-browse-btn");
  const jdDropzoneContent = document.getElementById("jd-dropzone-content");
  const jdFileInfo = document.getElementById("jd-file-info");
  const jdFileName = document.getElementById("jd-file-name");
  const removeJdBtn = document.getElementById("remove-jd-btn");
  const jdTextInput = document.getElementById("jd-text-input");

  const analyzeBtn = document.getElementById("analyze-match-btn");
  const loadingIndicator = document.getElementById("match-loading-indicator");
  const errorBox = document.getElementById("match-error-message");
  const resultBox = document.getElementById("result");

  let selectedResumeFile = null;
  let selectedJdFile = null;
  let activeTab = "upload"; 
  let lastSuggestions = [];
  let lastJobTitle = "";

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

  function renderBadges(items, className) {
    if (!items || items.length === 0) return '<p class="empty-note">None found</p>';
    return `<div class="badge-list">${items.map((i) => `<span class="${className}">${escapeHtml(i)}</span>`).join("")}</div>`;
  }

  function renderPlainList(items) {
    if (!items || items.length === 0) return '<p class="empty-note">None found</p>';
    return `<ul class="list-plain">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
  }

  /* ---- Resume dropzone ---- */

  function selectResume(file) {
    clearError();
    const err = validateFile(file);
    if (err) {
      showError(`Resume: ${err}`);
      return;
    }
    selectedResumeFile = file;
    resumeFileName.textContent = file.name;
    resumeFileInfo.hidden = false;
    resumeDropzoneContent.style.display = "none";
  }

  function clearResume() {
    selectedResumeFile = null;
    resumeFileInput.value = "";
    resumeFileInfo.hidden = true;
    resumeDropzoneContent.style.display = "flex";
  }

  resumeBrowseBtn.addEventListener("click", () => resumeFileInput.click());
  resumeDropzone.addEventListener("click", (e) => {
    if (e.target === resumeDropzone || resumeDropzoneContent.contains(e.target)) resumeFileInput.click();
  });
  resumeFileInput.addEventListener("change", () => {
    if (resumeFileInput.files.length > 0) selectResume(resumeFileInput.files[0]);
  });
  ["dragenter", "dragover"].forEach((evt) =>
    resumeDropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      resumeDropzone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    resumeDropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      resumeDropzone.classList.remove("dragover");
    })
  );
  resumeDropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files.length > 0) selectResume(e.dataTransfer.files[0]);
  });
  removeResumeBtn.addEventListener("click", clearResume);

  /* ---- JD tabs ---- */

  function setActiveTab(tab) {
    activeTab = tab;
    jdTabUploadBtn.classList.toggle("active", tab === "upload");
    jdTabPasteBtn.classList.toggle("active", tab === "paste");
    jdPanelUpload.classList.toggle("active", tab === "upload");
    jdPanelPaste.classList.toggle("active", tab === "paste");
  }

  jdTabUploadBtn.addEventListener("click", () => setActiveTab("upload"));
  jdTabPasteBtn.addEventListener("click", () => setActiveTab("paste"));

  /* ---- JD dropzone ---- */

  function selectJd(file) {
    clearError();
    const err = validateFile(file);
    if (err) {
      showError(`Job description: ${err}`);
      return;
    }
    selectedJdFile = file;
    jdFileName.textContent = file.name;
    jdFileInfo.hidden = false;
    jdDropzoneContent.style.display = "none";
  }

  function clearJd() {
    selectedJdFile = null;
    jdFileInput.value = "";
    jdFileInfo.hidden = true;
    jdDropzoneContent.style.display = "flex";
  }

  jdBrowseBtn.addEventListener("click", () => jdFileInput.click());
  jdDropzone.addEventListener("click", (e) => {
    if (e.target === jdDropzone || jdDropzoneContent.contains(e.target)) jdFileInput.click();
  });
  jdFileInput.addEventListener("change", () => {
    if (jdFileInput.files.length > 0) selectJd(jdFileInput.files[0]);
  });
  ["dragenter", "dragover"].forEach((evt) =>
    jdDropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      jdDropzone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    jdDropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      jdDropzone.classList.remove("dragover");
    })
  );
  jdDropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files.length > 0) selectJd(e.dataTransfer.files[0]);
  });
  removeJdBtn.addEventListener("click", clearJd);

  /* ---- Analyze ---- */

  analyzeBtn.addEventListener("click", uploadAndMatch);

  async function uploadAndMatch() {
    clearError();

    if (!selectedResumeFile) {
      showError("Please select a resume file.");
      return;
    }

    let jdText = "";
    if (activeTab === "paste") jdText = jdTextInput.value.trim();

    if (activeTab === "upload" && !selectedJdFile) {
      showError("Please select a job description file, or switch to Paste Text.");
      return;
    }
    if (activeTab === "paste" && jdText.length < 50) {
      showError("Please paste at least 50 characters of the job description.");
      return;
    }

    resultBox.hidden = true;
    loadingIndicator.hidden = false;

    const formData = new FormData();
    formData.append("resume", selectedResumeFile);
    if (activeTab === "paste") {
      formData.append("jd_input_type", "text");
      formData.append("jd_text", jdText);
    } else {
      formData.append("jd_input_type", "file");
      formData.append("jd_file", selectedJdFile);
    }

    try {
      const response = await fetch("/api/analyze-match", { method: "POST", body: formData });
      const data = await response.json();
      loadingIndicator.hidden = true;

      if (!response.ok || !data.success) {
        showError(data.error || "Something went wrong while analyzing the match.");
        return;
      }

      showResult(data);
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      loadingIndicator.hidden = true;
      showError("Could not reach the server. Please try again.");
    }
  }


  function showResult(data) {
    const banner = document.getElementById("match-ai-warning-banner");
    if (data.match_warning) {
      banner.innerHTML = `⚠ AI match analysis had a problem: ${escapeHtml(data.match_warning)}. Results below may be incomplete.`;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }

    showJobDescription(data.parsed_jd, data.jd_filename);
    showMatchBanner(data.match);
    showComparison(data.resume_parsed, data.parsed_jd);
    showStrengthsWeakAreas(data.strengths, data.weak_areas);
    showSkillsGrid(data.match);
    showCoverage(data.match.ats_keyword_coverage);
    showSuggestions(data.optimization_suggestions);

    lastSuggestions = data.optimization_suggestions || [];
    lastJobTitle = (data.parsed_jd && data.parsed_jd.job_title) || "Job";
  }

  function showJobDescription(jd, filename) {
    document.getElementById("jd-filename-display").textContent = filename || "Pasted text";

    const details = document.getElementById("jd-details");
    const responsibilities = jd.responsibilities || [];
    const qualifications = jd.qualifications || [];
    let html = `<div class="info-row"><span class="label">Job Title</span><span class="value">${escapeHtml(jd.job_title)}</span></div>`;
    html += `<div class="info-row"><span class="label">Company</span><span class="value">${escapeHtml(jd.company)}</span></div>`;
    if (responsibilities.length) {
      html += `<p class="label" style="margin-top:10px;margin-bottom:6px;">Responsibilities</p>${renderPlainList(responsibilities)}`;
    }
    if (qualifications.length) {
      html += `<p class="label" style="margin-top:10px;margin-bottom:6px;">Qualifications</p>${renderPlainList(qualifications)}`;
    }
    details.innerHTML = html;

    document.getElementById("jd-keywords").innerHTML = renderBadges(jd.keywords, "tag");
  }

  function showMatchBanner(match) {
    const el = document.getElementById("match-banner");
    el.innerHTML = `
      <span class="score-number">${match.match_percentage}%</span>
      <span class="summary-text">${escapeHtml(match.summary)}</span>
    `;
  }

  function showComparison(resumeParsed, jd) {
    const resumeCol = document.getElementById("resume-summary");
    const topSkills = (resumeParsed.skills || []).slice(0, 10);
    resumeCol.innerHTML = `
      <div class="col-heading">Your Resume</div>
      <div class="info-row"><span class="label">Name</span><span class="value">${escapeHtml(resumeParsed.full_name)}</span></div>
      <div class="info-row"><span class="label">Experience entries</span><span class="value">${(resumeParsed.work_experience || []).length}</span></div>
      <div class="info-row"><span class="label">Projects</span><span class="value">${(resumeParsed.projects || []).length}</span></div>
      <p class="label" style="margin-top:10px;margin-bottom:6px;">Skills</p>
      ${renderBadges(topSkills, "tag")}
    `;

    const jdCol = document.getElementById("jd-summary");
    jdCol.innerHTML = `
      <div class="col-heading">Job Description</div>
      <div class="info-row"><span class="label">Job Title</span><span class="value">${escapeHtml(jd.job_title)}</span></div>
      <div class="info-row"><span class="label">Company</span><span class="value">${escapeHtml(jd.company)}</span></div>
      <div class="info-row"><span class="label">Experience Required</span><span class="value">${escapeHtml(jd.required_experience)}</span></div>
      <p class="label" style="margin-top:10px;margin-bottom:6px;">Required Skills</p>
      ${renderBadges(jd.required_skills, "tag")}
    `;
  }

  function showStrengthsWeakAreas(strengths, weakAreas) {
    document.getElementById("strengths-card").innerHTML = `
      <div class="col-heading">Strengths</div>
      ${renderPlainList(strengths)}
    `;
    document.getElementById("weak-areas-card").innerHTML = `
      <div class="col-heading">Weak Areas</div>
      ${renderPlainList(weakAreas)}
    `;
  }

  function showSkillsGrid(match) {
    const grid = document.getElementById("missing-skills-grid");
    grid.innerHTML = `
      <div class="info-card">
        <div class="info-card-title">Matched Skills</div>
        ${renderBadges(match.matched_skills, "badge-matched")}
      </div>
      <div class="info-card">
        <div class="info-card-title">Missing Skills</div>
        ${renderBadges(match.missing_skills, "badge-missing")}
      </div>
    `;
  }

  function showCoverage(coverage) {
    const percentEl = document.getElementById("keyword-coverage-percent");
    if (coverage && coverage.length > 0) {
      const found = coverage.filter((item) => item.found_in_resume).length;
      percentEl.textContent = `${Math.round((found / coverage.length) * 100)}% (${found} of ${coverage.length} keywords found)`;
    } else {
      percentEl.textContent = "No keyword data available.";
    }

    const list = document.getElementById("coverage-list");
    if (!coverage || coverage.length === 0) {
      list.innerHTML = '<p class="empty-note">No keyword data available.</p>';
      return;
    }
    list.innerHTML = coverage
      .map(
        (item) => `
      <div class="coverage-row">
        <span>${escapeHtml(item.keyword)}</span>
        <span class="status-badge ${item.found_in_resume ? "status-good" : "status-missing"}">${item.found_in_resume ? "Found" : "Missing"}</span>
      </div>`
      )
      .join("");
  }

  function showSuggestions(suggestions) {
    const container = document.getElementById("suggestion-groups");
    const downloadBtn = document.getElementById("download-btn");

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<p class="empty-note">No specific suggestions - your resume already aligns well with this job description.</p>';
      downloadBtn.hidden = true;
      return;
    }

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
        try {
          await navigator.clipboard.writeText(groups[category][idx].suggested_text);
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

    downloadBtn.hidden = false;
  }

  

  document.getElementById("download-btn").addEventListener("click", () => {
    if (!lastSuggestions || lastSuggestions.length === 0) return;

    let content = `InterviewPrep AI - Resume Optimization Suggestions\n`;
    content += `Job Title: ${lastJobTitle}\n`;
    content += `${"=".repeat(50)}\n\n`;

    lastSuggestions.forEach((s, i) => {
      content += `${i + 1}. [${s.category}]\n`;
      content += `Current: ${s.current_text}\n`;
      content += `Suggested: ${s.suggested_text}\n`;
      if (s.reason) content += `Why: ${s.reason}\n`;
      content += `\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-optimization-suggestions.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
})();
