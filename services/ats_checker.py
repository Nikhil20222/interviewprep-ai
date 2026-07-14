
VALID_STATUSES = {"Good", "Needs Improvement", "Missing"}

ATS_SECTIONS = [
    ("formatting_check", "Formatting Check"),
    ("section_completeness", "Section Completeness"),
    ("keyword_coverage", "Keyword Coverage"),
    ("contact_information_check", "Contact Information Check"),
    ("readability", "Readability"),
    ("file_compatibility", "File Compatibility"),
]


def _clamp_score(value, default=0):
    try:
        value = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, min(100, value))


def _normalize_status(status: str) -> str:
    if status in VALID_STATUSES:
        return status
    return "Needs Improvement"


def format_ats(raw_ats: dict) -> dict:
    sections = []
    for key, label in ATS_SECTIONS:
        section_data = raw_ats.get(key, {}) or {}
        sections.append(
            {
                "key": key,
                "label": label,
                "status": _normalize_status(section_data.get("status", "")),
                "note": section_data.get("note", "No details available."),
            }
        )

    return {
        "overall_ats_score": _clamp_score(raw_ats.get("overall_ats_score")),
        "sections": sections,
    }


def fallback_ats() -> dict:
    """Used if AI insights generation fails entirely."""
    sections = [
        {"key": key, "label": label, "status": "Needs Improvement", "note": "Could not check right now."}
        for key, label in ATS_SECTIONS
    ]
    return {"overall_ats_score": 0, "sections": sections}


CHECKLIST_ITEMS = [
    ("email", "Email"),
    ("phone", "Phone"),
    ("linkedin", "LinkedIn"),
    ("skills", "Skills"),
    ("experience", "Experience"),
    ("certifications", "Certifications"),
]


def build_checklist(parsed_data: dict) -> list:
    skills_count = (
        len(parsed_data.get("skills", []))
        + len(parsed_data.get("programming_languages", []))
        + len(parsed_data.get("frameworks", []))
        + len(parsed_data.get("tools", []))
    )

    checks = {
        "email": parsed_data.get("email", "Not Found") != "Not Found",
        "phone": parsed_data.get("phone", "Not Found") != "Not Found",
        "linkedin": parsed_data.get("linkedin", "Not Found") != "Not Found",
        "skills": skills_count > 0,
        "experience": len(parsed_data.get("work_experience", [])) > 0,
        "certifications": len(parsed_data.get("certifications", [])) > 0,
    }

    reasons_missing = {
        "email": "No email address was found in the resume.",
        "phone": "No phone number was found in the resume.",
        "linkedin": "No LinkedIn URL was found - ATS systems often look for this.",
        "skills": "No skills section was detected.",
        "experience": "No work experience entries were detected.",
        "certifications": "No certifications were listed (optional, but adds points).",
    }

    checklist = []
    for key, label in CHECKLIST_ITEMS:
        passed = checks[key]
        checklist.append(
            {
                "key": key,
                "label": label,
                "passed": passed,
                "reason": "Found in resume." if passed else reasons_missing[key],
            }
        )
    return checklist
