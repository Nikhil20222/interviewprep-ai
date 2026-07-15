

(function () {
  "use strict";

  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const typeBadge = document.getElementById("question-type-badge");
  const remainingLabel = document.getElementById("question-remaining");
  const questionText = document.getElementById("question-text");
  const answerInput = document.getElementById("answer-input");
  const prevBtn = document.getElementById("prev-btn");
  const skipBtn = document.getElementById("skip-btn");
  const nextBtn = document.getElementById("next-btn");
  const loadingIndicator = document.getElementById("session-loading-indicator");
  const errorMessage = document.getElementById("session-error-message");
  const sessionBox = document.getElementById("session-box");

  let state = null;

  function loadState() {
    const params = new URLSearchParams(window.location.search);
    let raw = sessionStorage.getItem("interview_active");
    if (!raw && params.get("resume") === "1") {
      raw = localStorage.getItem("interview_in_progress");
    }
    if (!raw) {
      window.location.href = "/interview/setup";
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      window.location.href = "/interview/setup";
      return null;
    }
  }

  function persist() {
    sessionStorage.setItem("interview_active", JSON.stringify(state));
    localStorage.setItem("interview_in_progress", JSON.stringify(state));
  }

  function render() {
    const total = state.questions.length;
    const current = state.questions[state.currentIndex];
    const percent = ((state.currentIndex + 1) / total) * 100;

    progressFill.style.width = `${percent}%`;
    progressLabel.textContent = `Question ${state.currentIndex + 1} of ${total}`;
    remainingLabel.textContent = `${total - state.currentIndex - 1} remaining`;
    typeBadge.textContent = current.type || "Question";
    questionText.textContent = current.question;
    answerInput.value = state.answers[state.currentIndex] || "";

    prevBtn.disabled = state.currentIndex === 0;
    const isLast = state.currentIndex === total - 1;
    nextBtn.textContent = isLast ? "Finish Interview" : "Next";
  }

  answerInput.addEventListener("input", () => {
    state.answers[state.currentIndex] = answerInput.value;
    persist();
  });

  prevBtn.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      persist();
      render();
    }
  });

  skipBtn.addEventListener("click", () => {
    state.answers[state.currentIndex] = "";
    advance();
  });

  nextBtn.addEventListener("click", () => {
    state.answers[state.currentIndex] = answerInput.value;
    advance();
  });

  function advance() {
    persist();
    const isLast = state.currentIndex === state.questions.length - 1;
    if (isLast) {
      finishInterview();
    } else {
      state.currentIndex += 1;
      persist();
      render();
    }
  }

  async function finishInterview() {
    errorMessage.hidden = true;
    loadingIndicator.hidden = false;
    sessionBox.querySelector(".question-card").style.display = "none";
    document.querySelector(".session-nav").style.display = "none";

    const qaPairs = state.questions.map((q, i) => ({
      question: q.question,
      answer: state.answers[i] || "",
    }));

    try {
      const response = await fetch("/api/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qa_pairs: qaPairs,
          role: state.meta.role,
          interview_type: state.meta.interview_type,
        }),
      });
      const data = await response.json();
      loadingIndicator.hidden = true;

      if (!response.ok || !data.success) {
        showFinishError(data.error || "Something went wrong while generating feedback.");
        return;
      }

      sessionStorage.setItem(
        "interview_result",
        JSON.stringify({
          feedback: data.feedback,
          feedback_warning: data.feedback_warning || null,
          meta: state.meta,
          qa_pairs: qaPairs,
        })
      );
      sessionStorage.removeItem("interview_active");
      localStorage.removeItem("interview_in_progress");

      window.location.href = "/interview/results";
    } catch (err) {
      loadingIndicator.hidden = true;
      showFinishError("Could not reach the server. Your answers are still saved - please try again.");
    }
  }

  function showFinishError(msg) {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
    sessionBox.querySelector(".question-card").style.display = "block";
    document.querySelector(".session-nav").style.display = "flex";
  }

  state = loadState();
  if (state) render();
})();
