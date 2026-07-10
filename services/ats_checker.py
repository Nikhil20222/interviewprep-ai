
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
