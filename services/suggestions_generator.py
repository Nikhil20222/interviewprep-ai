"""
suggestions_generator.py
--------------------------
Takes the "suggestions" slice of the AI insights response and turns it
into a clean list for the template, dropping any malformed entries
rather than letting a bad AI response break the page.
"""


def format_suggestions(raw_suggestions: list) -> list:
    if not isinstance(raw_suggestions, list):
        return []

    formatted = []
    for item in raw_suggestions:
        if not isinstance(item, dict):
            continue
        current_text = (item.get("current_text") or "").strip()
        suggested_text = (item.get("suggested_text") or "").strip()
        if not current_text or not suggested_text:
            continue

        formatted.append(
            {
                "category": item.get("category", "General").strip() or "General",
                "current_text": current_text,
                "suggested_text": suggested_text,
                "reason": (item.get("reason") or "").strip(),
            }
        )

    return formatted[:8]


def fallback_suggestions() -> list:
    """Used if AI insights generation fails entirely."""
    return []
