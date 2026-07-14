"""
jd_match_analyzer.py  (Phase 2)

Handles the job description side of the match. The AI's job here is
kept to things that actually need judgment:
  - reading the JD and pulling out structured fields
  - writing resume optimization suggestions
  - a short compatibility note + strengths/weak areas

Match percentage, matched/missing skills, and keyword coverage are
NOT asked from the AI anymore - those are calculated with plain
Python in services/keyword_matcher.py, which is faster and more
consistent than asking a model to "guess" a percentage.
"""

from services.ai_client import generate_json, AIClientError

_SYSTEM_PROMPT = """You are an expert recruiter reviewing a resume against a job description.

Rules:
- Only use information that is actually in the text given to you. Never invent details.
- If something can't be found, use "Not Found".
- Respond with ONLY a valid JSON object, no markdown, no explanation.
"""

_USER_PROMPT_TEMPLATE = """Read this resume and job description, then return JSON in exactly this shape:

{{
  "parsed_jd": {{
    "job_title": string,
    "company": string,
    "required_skills": [string],
    "preferred_skills": [string],
    "required_experience": string,
    "qualifications": [string],
    "responsibilities": [string],
    "keywords": [string]
  }},
  "role_compatibility": string,
  "strengths": [string],
  "weak_areas": [string],
  "optimization_suggestions": [
    {{
      "category": string,
      "current_text": string,
      "suggested_text": string,
      "reason": string
    }}
  ]
}}

Notes:
- "keywords": the 8-15 most important ATS terms in the JD (skills, tools, certifications).
- "role_compatibility": one or two honest sentences on how well this candidate fits the role.
- "strengths": 2-5 things the resume does well for this specific role.
- "weak_areas": 2-5 things the resume is missing or should improve for this role.
- "optimization_suggestions": rewrite weak resume bullets to better match this JD.
  Only include a suggestion if "current_text" is a real excerpt from the resume.
  Max 8 suggestions.

Resume:
---
{resume_text}
---

Job description:
---
{jd_text}
---

Respond with ONLY the JSON object.
"""


class JDMatchError(Exception):
    pass


def _empty_result() -> dict:
    return {
        "parsed_jd": {
            "job_title": "Not Found",
            "company": "Not Found",
            "required_skills": [],
            "preferred_skills": [],
            "required_experience": "Not Found",
            "qualifications": [],
            "responsibilities": [],
            "keywords": [],
        },
        "role_compatibility": "Could not generate this right now.",
        "strengths": [],
        "weak_areas": [],
        "optimization_suggestions": [],
    }


def analyze_jd(resume_text: str, jd_text: str) -> dict:
    """
    Returns the AI's part of the analysis only:
    {"parsed_jd": {...}, "role_compatibility": str, "strengths": [...],
     "weak_areas": [...], "optimization_suggestions": [...]}
    Raises JDMatchError on failure.
    """
    try:
        result = generate_json(
            _SYSTEM_PROMPT,
            _USER_PROMPT_TEMPLATE.format(
                resume_text=resume_text[:12000], jd_text=jd_text[:8000]
            ),
        )
    except AIClientError as exc:
        raise JDMatchError(str(exc))

    defaults = _empty_result()
    result.setdefault("parsed_jd", defaults["parsed_jd"])
    for key, value in defaults["parsed_jd"].items():
        result["parsed_jd"].setdefault(key, value)

    result.setdefault("role_compatibility", defaults["role_compatibility"])
    result.setdefault("strengths", [])
    result.setdefault("weak_areas", [])
    result.setdefault("optimization_suggestions", [])

    return result


def fallback_result() -> dict:
    return _empty_result()
