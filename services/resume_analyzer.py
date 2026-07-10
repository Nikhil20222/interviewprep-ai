"""
resume_analyzer.py
--------------------
Takes the "scores" slice of the AI insights response and turns it into
a clean, guaranteed-complete structure for the template — filling
sensible defaults if the AI omitted a field, and clamping scores to
the valid 0-100 range.
"""

SCORE_KEYS = [
    "overall_score",
    "formatting_score",
    "content_score",
    "grammar_score",
    "readability_score",
    "project_quality_score",
    "experience_score",
    "skills_score",
]

SCORE_LABELS = {
    "overall_score": "Overall Resume Score",
    "formatting_score": "Formatting Score",
    "content_score": "Content Score",
    "grammar_score": "Grammar Score",
    "readability_score": "Readability Score",
    "project_quality_score": "Project Quality Score",
    "experience_score": "Experience Score",
    "skills_score": "Skills Score",
}


def _clamp(value, low=0, high=100, default=0):
    try:
        value = int(value)
    except (TypeError, ValueError):
        return default
    return max(low, min(high, value))


def format_analysis(raw_scores: dict) -> dict:
    explanations = raw_scores.get("explanations", {}) or {}

    cards = []
    for key in SCORE_KEYS:
        cards.append(
            {
                "key": key,
                "label": SCORE_LABELS[key],
                "score": _clamp(raw_scores.get(key)),
                "explanation": explanations.get(key, "No explanation available."),
            }
        )

    overall = next((c["score"] for c in cards if c["key"] == "overall_score"), 0)

    return {
        "overall_score": overall,
        "cards": cards,
    }


def fallback_analysis() -> dict:
    """Used if AI insights generation fails entirely."""
    cards = [
        {
            "key": key,
            "label": SCORE_LABELS[key],
            "score": 0,
            "explanation": "Could not generate this score right now.",
        }
        for key in SCORE_KEYS
    ]
    return {"overall_score": 0, "cards": cards}
