
import re

from services.ai_client import generate_json, AIClientError

NOT_FOUND = "Not Found"

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")
LINKEDIN_RE = re.compile(r"(https?://)?(www\.)?linkedin\.com/in/[A-Za-z0-9\-_/]+", re.IGNORECASE)
GITHUB_RE = re.compile(r"(https?://)?(www\.)?github\.com/[A-Za-z0-9\-_/]+", re.IGNORECASE)
PORTFOLIO_RE = re.compile(
    r"(https?://[A-Za-z0-9\-]+\.(dev|me|io|com|in|xyz|net)(/[A-Za-z0-9\-_/]*)?"
    r"|www\.[A-Za-z0-9\-]+\.(dev|me|io|com|in|xyz|net)(/[A-Za-z0-9\-_/]*)?"
    r"|[A-Za-z0-9\-]+\.(dev|me|io|xyz)(/[A-Za-z0-9\-_/]*)?)",
    re.IGNORECASE,
)


def _first_match(pattern: re.Pattern, text: str) -> str:
    match = pattern.search(text)
    return match.group(0).strip() if match else NOT_FOUND


def _extract_contact_fields(text: str) -> dict:
    email = _first_match(EMAIL_RE, text)
    phone = _first_match(PHONE_RE, text)
    linkedin = _first_match(LINKEDIN_RE, text)
    github = _first_match(GITHUB_RE, text)

    # Portfolio: look for a personal site that isn't linkedin/github and isn't
    # actually just the domain half of an email address.
    email_spans = [m.span() for m in EMAIL_RE.finditer(text)]

    def _overlaps_email(start, end):
        return any(start < e_end and end > e_start for e_start, e_end in email_spans)

    portfolio = NOT_FOUND
    for match in PORTFOLIO_RE.finditer(text):
        candidate = match.group(0)
        lower = candidate.lower()
        if "linkedin.com" in lower or "github.com" in lower:
            continue
        if _overlaps_email(match.start(), match.end()):
            continue
        portfolio = candidate.strip()
        break

    return {
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
        "portfolio": portfolio,
    }


_SYSTEM_PROMPT = """You are a precise resume-parsing engine.
You extract structured information from resume text.

CRITICAL RULES:
- Never invent, guess, or assume information that is not clearly present in the text.
- If a field cannot be found, its value MUST be exactly "Not Found".
- Only extract what is explicitly written in the resume text.
- Look carefully through the ENTIRE text (including headers, footers, and lines with
  icons or unusual spacing) for contact details like email, phone, LinkedIn, GitHub,
  and portfolio links - these are often at the very top of the resume.
- Respond with ONLY a valid JSON object, no markdown, no explanation, no preamble.
"""

_USER_PROMPT_TEMPLATE = """Extract the following fields from this resume text and return them as JSON
with exactly these keys:

- full_name (string)
- email (string)
- phone (string)
- linkedin (string, full URL or handle if present)
- github (string, full URL or handle if present)
- portfolio (string, personal website URL if present, not linkedin/github)
- skills (array of strings)
- programming_languages (array of strings)
- frameworks (array of strings)
- tools (array of strings)
- education (array of objects: {{"degree": string, "institution": string, "year": string}})
- work_experience (array of objects: {{"title": string, "company": string, "duration": string, "description": string}})
- projects (array of objects: {{"name": string, "description": string, "technologies": string}})
- certifications (array of strings)
- achievements (array of strings)
- languages (array of strings)

If any string field cannot be found, use exactly "Not Found".
If an array field has no items, return an empty array [].

Resume text:
---
{resume_text}
---

Respond with ONLY the JSON object.
"""


def _empty_ai_fields() -> dict:
    """Fallback structure used if the AI call fails, so the app degrades gracefully."""
    return {
        "full_name": NOT_FOUND,
        "email": NOT_FOUND,
        "phone": NOT_FOUND,
        "linkedin": NOT_FOUND,
        "github": NOT_FOUND,
        "portfolio": NOT_FOUND,
        "skills": [],
        "programming_languages": [],
        "frameworks": [],
        "tools": [],
        "education": [],
        "work_experience": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
        "languages": [],
    }


def parse_resume(resume_text: str) -> dict:
    """
    AI is the primary source for every field, including contact details -
    this handles unusual resume layouts (tables, icons, odd spacing) far
    better than fixed regex patterns. A lightweight regex pass still runs
    as a silent backup: if the AI returns "Not Found" for a contact field
    but regex finds a plausible match, that match is used instead. Never
    raises: on AI failure, fields fall back to regex-only / empty so the
    rest of the app can still render.
    """
    regex_fields = _extract_contact_fields(resume_text)

    ai_error = None
    try:
        ai_fields = generate_json(
            _SYSTEM_PROMPT,
            _USER_PROMPT_TEMPLATE.format(resume_text=resume_text[:12000]),
        )
    except AIClientError as exc:
        ai_fields = _empty_ai_fields()
        ai_error = str(exc)

    # Guard against missing keys if the AI omits something
    defaults = _empty_ai_fields()
    for key, default_value in defaults.items():
        ai_fields.setdefault(key, default_value)

    # Silent backup: if AI missed a contact field, use the regex match instead
    for key in ("email", "phone", "linkedin", "github", "portfolio"):
        if ai_fields.get(key) in (NOT_FOUND, "", None) and regex_fields.get(key, NOT_FOUND) != NOT_FOUND:
            ai_fields[key] = regex_fields[key]

    if ai_error:
        ai_fields["_ai_warning"] = ai_error
    return ai_fields
