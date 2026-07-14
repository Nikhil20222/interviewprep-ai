import re


def _normalize(word: str) -> str:
    return word.strip().lower()


def is_mentioned(term: str, resume_skills: list, resume_text: str) -> bool:
    """True if `term` shows up in the resume's parsed skills list or raw text."""
    term_norm = _normalize(term)
    if not term_norm:
        return False

    for skill in resume_skills:
        if _normalize(skill) == term_norm:
            return True

    # Word-boundary search so "R" doesn't match inside "Report", etc.
    pattern = r"\b" + re.escape(term_norm) + r"\b"
    return bool(re.search(pattern, resume_text.lower()))


def match_skills(required_skills: list, resume_skills: list, resume_text: str) -> tuple:
    """Returns (matched, missing) lists for the given required skills."""
    matched, missing = [], []
    for skill in required_skills:
        if is_mentioned(skill, resume_skills, resume_text):
            matched.append(skill)
        else:
            missing.append(skill)
    return matched, missing


def keyword_coverage(keywords: list, resume_skills: list, resume_text: str) -> list:
    """Returns [{"keyword": ..., "found_in_resume": bool}, ...] for each JD keyword."""
    return [
        {"keyword": kw, "found_in_resume": is_mentioned(kw, resume_skills, resume_text)}
        for kw in keywords
    ]


def calculate_match_percentage(matched_skills: list, required_skills: list, coverage: list) -> int:
    """
    Simple weighted score: 60% how many required skills matched,
    40% how many JD keywords are covered. No AI involved.
    """
    skills_ratio = (len(matched_skills) / len(required_skills)) if required_skills else 0
    covered = sum(1 for item in coverage if item["found_in_resume"])
    keyword_ratio = (covered / len(coverage)) if coverage else 0

    score = (skills_ratio * 0.6) + (keyword_ratio * 0.4)
    return round(score * 100)
