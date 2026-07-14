NOT_FOUND = "Not Found"


def _string_list(value):
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def format_parsed_jd(raw_jd: dict) -> dict:
    return {
        "job_title": raw_jd.get("job_title") or NOT_FOUND,
        "company": raw_jd.get("company") or NOT_FOUND,
        "required_skills": _string_list(raw_jd.get("required_skills")),
        "preferred_skills": _string_list(raw_jd.get("preferred_skills")),
        "required_experience": raw_jd.get("required_experience") or NOT_FOUND,
        "qualifications": _string_list(raw_jd.get("qualifications")),
        "responsibilities": _string_list(raw_jd.get("responsibilities")),
        "keywords": _string_list(raw_jd.get("keywords")),
    }


def build_match(matched_skills, missing_skills, coverage, match_percentage, summary) -> dict:
    """Assembles the final match dict from Python-calculated values."""
    missing_keywords = [item["keyword"] for item in coverage if not item["found_in_resume"]]
    return {
        "match_percentage": match_percentage,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "missing_keywords": missing_keywords,
        "ats_keyword_coverage": coverage,
        "summary": summary,
    }
