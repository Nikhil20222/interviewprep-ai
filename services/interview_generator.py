
from services.ai_client import generate_json, AIClientError

ALLOWED_DIFFICULTIES = {"Easy", "Medium", "Hard"}
ALLOWED_TYPES = {"Technical", "HR", "Behavioural", "Mixed"}

_SYSTEM_PROMPT = """You are an experienced technical interviewer and hiring manager.
You write realistic, specific interview questions - never generic filler questions.

CRITICAL RULES:
- Base every question on the actual resume and job description given to you.
- Reference real skills, projects, or requirements where relevant, instead of
  asking something completely generic that could apply to anyone.
- Respond with ONLY a valid JSON object, no markdown, no explanation, no preamble.
"""

_USER_PROMPT_TEMPLATE = """Generate {num_questions} interview questions for this candidate applying to this role.

Interview type: {interview_type}
Difficulty: {difficulty}
Job role: {role}

Return a JSON object with exactly this shape:

{{
  "questions": [
    {{"type": string, "question": string}}
  ]
}}

Guidance:
- "type" must be one of: "Technical", "HR", "Behavioural", "Coding" - pick whichever
  fits the interview type. If interview type is "Mixed", vary the types across questions.
- If interview type is "Technical", focus on the candidate's actual skills/projects
  from the resume and the requirements in the job description.
- If interview type is "HR", ask about motivation, career goals, culture fit.
- If interview type is "Behavioural", ask situational/STAR-style questions
  referencing the candidate's actual experience where possible.
- If interview type is "Mixed", combine Technical, HR, Behavioural, and one or two Coding questions.
- Keep questions concise (1-2 sentences each).
- Return exactly {num_questions} questions, no more, no fewer.

Resume text:
---
{resume_text}
---

Job description text:
---
{jd_text}
---

Respond with ONLY the JSON object.
"""


class InterviewGenerationError(Exception):
    pass


def _clamp_num_questions(value: int) -> int:
    try:
        value = int(value)
    except (TypeError, ValueError):
        return 5
    return max(3, min(15, value))


def normalize_difficulty(value: str) -> str:
    return value if value in ALLOWED_DIFFICULTIES else "Medium"


def normalize_interview_type(value: str) -> str:
    return value if value in ALLOWED_TYPES else "Mixed"


def generate_interview_questions(
    resume_text: str,
    jd_text: str,
    role: str,
    difficulty: str,
    interview_type: str,
    num_questions: int,
) -> list:
    """
    Returns a list of {"type": str, "question": str} dicts.
    Raises InterviewGenerationError on failure so the route can decide how to degrade.
    """
    num_questions = _clamp_num_questions(num_questions)
    difficulty = normalize_difficulty(difficulty)
    interview_type = normalize_interview_type(interview_type)
    role = (role or "").strip() or "Not specified - infer the most likely role from the job description"

    try:
        result = generate_json(
            _SYSTEM_PROMPT,
            _USER_PROMPT_TEMPLATE.format(
                num_questions=num_questions,
                interview_type=interview_type,
                difficulty=difficulty,
                role=role,
                resume_text=resume_text[:12000],
                jd_text=jd_text[:8000],
            ),
        )
    except AIClientError as exc:
        raise InterviewGenerationError(str(exc))

    raw_questions = result.get("questions", [])
    if not isinstance(raw_questions, list) or len(raw_questions) == 0:
        raise InterviewGenerationError("AI did not return any questions.")

    questions = []
    for i, item in enumerate(raw_questions):
        if not isinstance(item, dict):
            continue
        question_text = str(item.get("question", "")).strip()
        if not question_text:
            continue
        questions.append(
            {
                "id": i + 1,
                "type": str(item.get("type", interview_type)).strip() or interview_type,
                "question": question_text,
            }
        )

    if not questions:
        raise InterviewGenerationError("AI response did not contain usable questions.")

    return questions
