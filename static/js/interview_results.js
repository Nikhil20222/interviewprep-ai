/* Phase 3 - Interview Results page logic. */

(function () {
  "use strict";

  const emptyState = document.getElementById("empty-state");
  const resultsBox = document.getElementById("results-box");

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  const raw = sessionStorage.getItem("interview_result");
  if (!raw) {
    emptyState.hidden = false;
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    emptyState.hidden = false;
    return;
  }

  resultsBox.hidden = false;
  const feedback = data.feedback;

  if (data.feedback_warning) {
    const banner = document.getElementById("results-ai-warning-banner");
    banner.innerHTML = `⚠ AI feedback had a problem: ${escapeHtml(data.feedback_warning)}. Results below may be incomplete.`;
    banner.hidden = false;
  }

  document.getElementById("overall-score-banner").innerHTML = `
    <span class="score-number">${feedback.overall_score}</span>
    <span class="score-out-of">/ 100</span>
    <span class="score-label">Overall Score</span>
  `;

  const categories = [
    ["Communication", feedback.communication],
    ["Technical Accuracy", feedback.technical_accuracy],
    ["Problem Solving", feedback.problem_solving],
    ["Confidence", feedback.confidence],
  ];
  document.getElementById("category-scores").innerHTML = categories
    .map(
      ([label, value]) => `
    <div class="category-score-row">
      <span class="category-score-label">${label}</span>
      <div class="score-bar-track" style="flex:1;"><div class="score-bar-fill" style="width:${value}%"></div></div>
      <span class="category-score-value">${value}</span>
    </div>`
    )
    .join("");

  document.getElementById("summary-text").textContent = feedback.summary;

  function renderList(containerId, items, emptyText) {
    const el = document.getElementById(containerId);
    if (!items || items.length === 0) {
      el.innerHTML = `<p class="empty-note">${emptyText}</p>`;
      return;
    }
    el.innerHTML = `<ul class="list-plain">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
  }

  renderList("strengths-list", feedback.strengths, "No specific strengths identified.");
  renderList("weaknesses-list", feedback.weaknesses, "No specific weaknesses identified.");
  renderList("suggestions-list", feedback.suggestions, "No suggestions available.");

  const reviewList = document.getElementById("question-review-list");
  if (feedback.question_review && feedback.question_review.length > 0) {
    reviewList.innerHTML = feedback.question_review
      .map(
        (item, i) => `
      <div class="review-item">
        <p class="review-question">Q${i + 1}. ${escapeHtml(item.question)}</p>
        <div class="review-answer">${escapeHtml(item.answer) || "(skipped)"}</div>
        <p class="review-feedback">${escapeHtml(item.feedback)} <strong>(${item.score}/100)</strong></p>
      </div>`
      )
      .join("");
  } else {
    reviewList.innerHTML = '<p class="empty-note">No question review available.</p>';
  }

  document.getElementById("export-btn").addEventListener("click", () => {
    let content = `InterviewPrep AI - Interview Results\n`;
    content += `Role: ${data.meta.role || "Not specified"} | Type: ${data.meta.interview_type} | Difficulty: ${data.meta.difficulty}\n`;
    content += `${"=".repeat(50)}\n\n`;
    content += `Overall Score: ${feedback.overall_score}/100\n`;
    content += `Communication: ${feedback.communication}/100\n`;
    content += `Technical Accuracy: ${feedback.technical_accuracy}/100\n`;
    content += `Problem Solving: ${feedback.problem_solving}/100\n`;
    content += `Confidence: ${feedback.confidence}/100\n\n`;
    content += `Summary:\n${feedback.summary}\n\n`;
    content += `Strengths:\n${(feedback.strengths || []).map((s) => `- ${s}`).join("\n")}\n\n`;
    content += `Weaknesses:\n${(feedback.weaknesses || []).map((s) => `- ${s}`).join("\n")}\n\n`;
    content += `Suggestions:\n${(feedback.suggestions || []).map((s) => `- ${s}`).join("\n")}\n\n`;
    content += `Question-wise Review:\n${"-".repeat(30)}\n`;
    (feedback.question_review || []).forEach((item, i) => {
      content += `\nQ${i + 1}. ${item.question}\n`;
      content += `Answer: ${item.answer || "(skipped)"}\n`;
      content += `Feedback: ${item.feedback} (${item.score}/100)\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-results.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
})();
