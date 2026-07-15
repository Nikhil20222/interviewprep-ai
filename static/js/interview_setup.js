

(function () {
  "use strict";

  const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
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

  const roleInput = document.getElementById("role-input");
  const typeTabs = document.getElementById("type-tabs");
  const difficultyTabs = document.getElementById("difficulty-tabs");
  const durationInput = document.getElementById("duration-input");
  const numQuestionsInput = document.getElementById("num-questions-input");

  const generateBtn = document.getElementById("generate-btn");
  const loadingIndicator = document.getElementById("setup-loading-indicator");
  const errorMessage = document.getElementById("setup-error-message");

  let selectedResumeFile = null;
  let selectedJdFile = null;
  let activeJdTab = "upload";
  let selectedType = "Mixed";
  let selectedDifficulty = "Medium";

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.hidden = true;
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

  /* ---------------- Resume dropzone ---------------- */

  function handleResumeSelected(file) {
    clearError();
    const err = validateClientSide(file);
    if (err) {
      showError(`Resume: ${err}`);
      return;
    }
    selectedResumeFile = file;
    resumeFileName.textContent = file.name;
    resumeFileInfo.hidden = false;
    resumeDropzoneContent.style.display = "none";
  }

  resumeBrowseBtn.addEventListener("click", () => resumeFileInput.click());
  resumeDropzone.addEventListener("click", (e) => {
    if (e.target === resumeDropzone || resumeDropzoneContent.contains(e.target)) resumeFileInput.click();
  });
  resumeFileInput.addEventListener("change", () => {
    if (resumeFileInput.files.length > 0) handleResumeSelected(resumeFileInput.files[0]);
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
    if (e.dataTransfer.files.length > 0) handleResumeSelected(e.dataTransfer.files[0]);
  });
  removeResumeBtn.addEventListener("click", () => {
    selectedResumeFile = null;
    resumeFileInput.value = "";
    resumeFileInfo.hidden = true;
    resumeDropzoneContent.style.display = "flex";
  });

  /* ---------------- JD tabs + dropzone ---------------- */

  function setActiveJdTab(tab) {
    activeJdTab = tab;
    jdTabUploadBtn.classList.toggle("active", tab === "upload");
    jdTabPasteBtn.classList.toggle("active", tab === "paste");
    jdPanelUpload.classList.toggle("active", tab === "upload");
    jdPanelPaste.classList.toggle("active", tab === "paste");
  }

  jdTabUploadBtn.addEventListener("click", () => setActiveJdTab("upload"));
  jdTabPasteBtn.addEventListener("click", () => setActiveJdTab("paste"));

  function handleJdSelected(file) {
    clearError();
    const err = validateClientSide(file);
    if (err) {
      showError(`Job description: ${err}`);
      return;
    }
    selectedJdFile = file;
    jdFileName.textContent = file.name;
    jdFileInfo.hidden = false;
    jdDropzoneContent.style.display = "none";
  }

  jdBrowseBtn.addEventListener("click", () => jdFileInput.click());
  jdDropzone.addEventListener("click", (e) => {
    if (e.target === jdDropzone || jdDropzoneContent.contains(e.target)) jdFileInput.click();
  });
  jdFileInput.addEventListener("change", () => {
    if (jdFileInput.files.length > 0) handleJdSelected(jdFileInput.files[0]);
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
    if (e.dataTransfer.files.length > 0) handleJdSelected(e.dataTransfer.files[0]);
  });
  removeJdBtn.addEventListener("click", () => {
    selectedJdFile = null;
    jdFileInput.value = "";
    jdFileInfo.hidden = true;
    jdDropzoneContent.style.display = "flex";
  });

  /* ---------------- Type / difficulty tabs ---------------- */

  typeTabs.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      typeTabs.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedType = btn.getAttribute("data-value");
    });
  });

  difficultyTabs.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      difficultyTabs.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedDifficulty = btn.getAttribute("data-value");
    });
  });

  /* ---------------- Generate ---------------- */

  generateBtn.addEventListener("click", async () => {
    clearError();

    if (!selectedResumeFile) {
      showError("Please select a resume file.");
      return;
    }

    let jdText = "";
    if (activeJdTab === "paste") {
      jdText = jdTextInput.value.trim();
      if (jdText.length < 50) {
        showError("Please paste at least 50 characters of the job description.");
        return;
      }
    } else if (!selectedJdFile) {
      showError("Please select a job description file, or switch to Paste Text.");
      return;
    }

    const numQuestions = parseInt(numQuestionsInput.value, 10) || 5;
    if (numQuestions < 3 || numQuestions > 15) {
      showError("Number of questions must be between 3 and 15.");
      return;
    }

    loadingIndicator.hidden = false;
    generateBtn.disabled = true;

    const formData = new FormData();
    formData.append("resume", selectedResumeFile);
    if (activeJdTab === "paste") {
      formData.append("jd_input_type", "text");
      formData.append("jd_text", jdText);
    } else {
      formData.append("jd_input_type", "file");
      formData.append("jd_file", selectedJdFile);
    }
    formData.append("role", roleInput.value.trim());
    formData.append("interview_type", selectedType);
    formData.append("difficulty", selectedDifficulty);
    formData.append("duration", durationInput.value);
    formData.append("num_questions", numQuestions);

    try {
      const response = await fetch("/api/generate-interview", { method: "POST", body: formData });
      const data = await response.json();
      loadingIndicator.hidden = true;
      generateBtn.disabled = false;

      if (!response.ok || !data.success) {
        showError(data.error || "Something went wrong while generating the interview.");
        return;
      }

      const sessionData = {
        questions: data.questions,
        meta: data.meta,
        answers: new Array(data.questions.length).fill(""),
        currentIndex: 0,
      };
      sessionStorage.setItem("interview_active", JSON.stringify(sessionData));
      localStorage.setItem("interview_in_progress", JSON.stringify(sessionData));

      window.location.href = "/interview/session";
    } catch (err) {
      loadingIndicator.hidden = true;
      generateBtn.disabled = false;
      showError("Could not reach the server. Please try again.");
    }
  });
})();
