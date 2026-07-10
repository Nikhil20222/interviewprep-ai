"""
insights_generator.py
----------------------
Makes ONE combined AI call that produces resume analysis scores,
ATS compatibility results, and improvement suggestions together.

Why combined into one call instead of three separate service calls:
free-tier AI APIs (Groq/Gemini/OpenRouter) have request-per-minute
limits, so bundling related analysis into a single prompt keeps the
app well within those limits (2 AI calls total per resume: one for
parsing, one for this bundle) while still keeping the *code* split
into separate, single-responsibility modules
(resume_analyzer.py / ats_checker.py / suggestions_generator.py).
"""

from services.ai_client import generate_json, AIClientError

_SYSTEM_PROMPT = """You are an expert resume reviewer and ATS (Applicant Tracking System) simulator.
You evaluate resumes honestly and constructively.

CRITICAL RULES:
- Base every judgment only on the resume text given to you.
- Never invent facts about the candidate that are not in the text.
- Scores must be integers from 0 to 100.
- Status values must be exactly one of: "Good", "Needs Improvement", "Missing".
- Respond with ONLY a valid JSON object, no markdown, no explanation, no preamble.
"""

_USER_PROMPT_TEMPLATE = """Analyze the following resume text and return a JSON object with exactly this shape:

{{
  "scores": {{
    "overall_score": int,
    "formatting_score": int,
    "content_score": int,
    "grammar_score": int,
    "readability_score": int,
    "project_quality_score": int,
    "experience_score": int,
    "skills_score": int,
    "explanations": {{
      "overall_score": string,
      "formatting_score": string,
      "content_score": string,
      "grammar_score": string,
      "readability_score": string,
      "project_quality_score": string,
      "experience_score": string,
      "skills_score": string
    }}
  }},
  "ats": {{
    "overall_ats_score": int,
    "formatting_check": {{"status": string, "note": string}},
    "section_completeness": {{"status": string, "note": string}},
    "keyword_coverage": {{"status": string, "note": string}},
    "contact_information_check": {{"status": string, "note": string}},
    "readability": {{"status": string, "note": string}},
    "file_compatibility": {{"status": string, "note": string}}
  }},
  "suggestions": [
    {{
      "category": string,
      "current_text": string,
      "suggested_text": string,
      "reason": string
    }}
  ]
}}

Guidance:
- "suggestions" should cover weak bullet points, missing action verbs, missing measurable
  achievements, weak project descriptions, weak professional summary, missing technical
  keywords, missing certifications, and resume length issues — but ONLY include a
  suggestion if you found a real, specific example of it in the text. If "current_text"
  cannot be a real excerpt/paraphrase of something in the resume, do not include that
  suggestion. Provide at most 8 suggestions, ordered by impact.
- Every "status" field in "ats" must be exactly "Good", "Needs Improvement", or "Missing".

Resume text:
---
{resume_text}
---

Respond with ONLY the JSON object.
"""


class InsightsError(Exception):
    pass


def generate_insights(resume_text: str) -> dict:
    """
    Returns the raw combined AI JSON: {"scores": {...}, "ats": {...}, "suggestions": [...]}.
    Raises InsightsError on failure so the route can decide how to degrade.
    """
    try:
        result = generate_json(
            _SYSTEM_PROMPT,
            _USER_PROMPT_TEMPLATE.format(resume_text=resume_text[:12000]),
        )
    except AIClientError as exc:
        raise InsightsError(str(exc))

    result.setdefault("scores", {})
    result.setdefault("ats", {})
    result.setdefault("suggestions", [])
    return result
