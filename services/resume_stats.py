def word_count(text: str) -> int:
    return len(text.split())


def char_count(text: str) -> int:
    return len(text)


def estimate_pages(text: str) -> int:
    # ~500 words fits on one standard resume page. Never return 0.
    words = word_count(text)
    return max(1, round(words / 500))


def count_sections(parsed_data: dict) -> dict:
    """
    Counts how many items were found in each resume section.
    parsed_data is the dict returned by resume_parser.parse_resume().
    """
    skills = (
        len(parsed_data.get("skills", []))
        + len(parsed_data.get("programming_languages", []))
        + len(parsed_data.get("frameworks", []))
        + len(parsed_data.get("tools", []))
    )

    return {
        "skills_found": skills,
        "projects_found": len(parsed_data.get("projects", [])),
        "education_found": len(parsed_data.get("education", [])),
        "experience_found": len(parsed_data.get("work_experience", [])),
        "certifications_found": len(parsed_data.get("certifications", [])),
    }


def get_resume_stats(resume_text: str, parsed_data: dict) -> dict:
    stats = {
        "word_count": word_count(resume_text),
        "char_count": char_count(resume_text),
        "pages": estimate_pages(resume_text),
    }
    stats.update(count_sections(parsed_data))
    return stats
