
from services.ai_client import generate_json, AIClientError

_SYSTEM_PROMPT = """You are an experienced interview coach giving honest, constructive feedback.

CRITICAL RULES:
- Base every judgment only on the actual questions and answers given to you.
- If an answer is blank, very short, or was skipped, score it low and say so plainly -
  never invent quality that isn't there.
- Scores must be realistic integers from 0 to 100. Do not default to round numbers
  like 70/80/90 for every candidate - vary scores based on actual answer quality.
- Respond with ONLY a valid JSON object, no markdown, no explanation, no preamble.
"""

_USER_PROMPT_TEMPLATE = """A candidate completed a mock {interview_type} interview for the role of {role}.
Review their questions and answers below, then return a JSON object with exactly this shape:

{{
  "overall_score": int,
  "communication": int,
  "technical_accuracy": int,
  "problem_solving": int,
  "confidence": int,
  "summary": string,
  "strengths": [string],
  "weaknesses": [string],
  "suggestions": [string],
  "question_review": [
    {{"question": string, "answer": string, "feedback": string, "score": int}}
  ]
}}

Guidance:
- "communication", "technical_accuracy", "problem_solving", "confidence" are each 0-100.
- "technical_accuracy" and "problem_solving" should be scored fairly even for HR/Behavioural
  questions - focus on clarity of reasoning and structure instead if there's no technical content.
- "question_review" must contain one entry per question, in the same order given below,
  with a short (1-2 sentence) piece of feedback per answer.
- If an answer was blank or "(skipped)", say so in the feedback and score it low (0-20).
- Keep "summary" to 2-3 sentences.

Questions and answers:
---
{qa_text}
---

Respond with ONLY the JSON object.
"""


class InterviewFeedbackError(Exception):
    pass


def _format_qa_text(qa_pairs: list) -> str:
    lines = []
    for i, pair in enumerate(qa_pairs):
        question = pair.get("question", "").strip()
        answer = pair.get("answer", "").strip() or "(skipped)"
        lines.append(f"Q{i + 1}: {question}\nA{i + 1}: {answer}")
    return "\n\n".join(lines)


def _clamp_score(value, default=0):
    try:
        value = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, min(100, value))


def generate_interview_feedback(qa_pairs: list, role: str, interview_type: str) -> dict:
    """
    Returns structured feedback. Raises InterviewFeedbackError on failure
    so the route can decide how to degrade.
    """
    if not qa_pairs:
        raise InterviewFeedbackError("No questions/answers were provided.")

    qa_text = _format_qa_text(qa_pairs)

    try:
        result = generate_json(
            _SYSTEM_PROMPT,
            _USER_PROMPT_TEMPLATE.format(
                interview_type=interview_type or "Mixed",
                role=role or "the target role",
                qa_text=qa_text[:14000],
            ),
        )
    except AIClientError as exc:
        raise InterviewFeedbackError(str(exc))

    question_review_raw = result.get("question_review", [])
    question_review = []
    if isinstance(question_review_raw, list):
        for item in question_review_raw:
            if not isinstance(item, dict):
                continue
            question_review.append(
                {
                    "question": str(item.get("question", "")).strip(),
                    "answer": str(item.get("answer", "")).strip(),
                    "feedback": str(item.get("feedback", "")).strip() or "No feedback available.",
                    "score": _clamp_score(item.get("score")),
                }
            )

    def string_list(value):
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    return {
        "overall_score": _clamp_score(result.get("overall_score")),
        "communication": _clamp_score(result.get("communication")),
        "technical_accuracy": _clamp_score(result.get("technical_accuracy")),
        "problem_solving": _clamp_score(result.get("problem_solving")),
        "confidence": _clamp_score(result.get("confidence")),
        "summary": (result.get("summary") or "").strip() or "No summary available.",
        "strengths": string_list(result.get("strengths")),
        "weaknesses": string_list(result.get("weaknesses")),
        "suggestions": string_list(result.get("suggestions")),
        "question_review": question_review,
    }


def fallback_feedback(qa_pairs: list) -> dict:
    """Used if AI feedback generation fails entirely."""
    return {
        "overall_score": 0,
        "communication": 0,
        "technical_accuracy": 0,
        "problem_solving": 0,
        "confidence": 0,
        "summary": "Could not generate feedback right now. Please try again.",
        "strengths": [],
        "weaknesses": [],
        "suggestions": [],
        "question_review": [
            {
                "question": pair.get("question", ""),
                "answer": pair.get("answer", ""),
                "feedback": "Feedback unavailable.",
                "score": 0,
            }
            for pair in qa_pairs
        ],
    }
