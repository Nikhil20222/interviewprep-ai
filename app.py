"""
app.py

InterviewPrep AI - Phase 1 + Phase 2

Single-page flow: upload happens via one API call that does everything
(extract, parse, analyze) and sends back JSON, rendered by JS. No
server-side sessions needed, which keeps this simple on Vercel.
"""

import os
import uuid

from flask import Flask, render_template, request, jsonify

from config import Config
from utils.validators import validate_file, validate_pasted_text, ValidationError
from utils.file_cleanup import safe_remove
from services.file_extractor import extract_text, FileExtractionError
from services.resume_parser import parse_resume
from services.insights_generator import generate_insights, InsightsError
from services.resume_analyzer import format_analysis, fallback_analysis
from services.ats_checker import format_ats, fallback_ats, build_checklist
from services.suggestions_generator import format_suggestions, fallback_suggestions
from services.resume_stats import get_resume_stats
from services.jd_match_analyzer import analyze_jd, JDMatchError, fallback_result
from services.match_formatter import format_parsed_jd, build_match
from services.keyword_matcher import match_skills, keyword_coverage, calculate_match_percentage

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = Config.MAX_UPLOAD_SIZE_BYTES


def resume_skill_list(parsed_data: dict) -> list:
    """Flattens every skill-ish field into one list for matching purposes."""
    return (
        parsed_data.get("skills", [])
        + parsed_data.get("programming_languages", [])
        + parsed_data.get("frameworks", [])
        + parsed_data.get("tools", [])
    )


@app.route("/")
def index():
    return render_template("index.html", max_size_mb=Config.MAX_UPLOAD_SIZE_MB, active_page="phase1")


@app.route("/api/analyze-resume", methods=["POST"])
def analyze_resume():
    file_storage = request.files.get("resume")
    temp_path = None

    try:
        extension = validate_file(file_storage)
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    try:
        temp_filename = f"{uuid.uuid4().hex}.{extension}"
        temp_path = os.path.join(Config.TEMP_UPLOAD_DIR, temp_filename)
        file_storage.save(temp_path)

        resume_text = extract_text(temp_path, extension)

        parsed_data = parse_resume(resume_text)
        if parsed_data.get("_ai_warning"):
            print(f"[AI WARNING - resume parsing] {parsed_data['_ai_warning']}")

        # Plain Python stats - word count, skills found, etc. No AI here.
        stats = get_resume_stats(resume_text, parsed_data)

        # Plain Python checklist - email/phone/linkedin/etc present or not.
        checklist = build_checklist(parsed_data)

        # AI call: scores + ATS notes + suggestions
        try:
            raw_insights = generate_insights(resume_text)
            analysis = format_analysis(raw_insights.get("scores", {}))
            ats = format_ats(raw_insights.get("ats", {}))
            suggestions = format_suggestions(raw_insights.get("suggestions", []))
            insights_warning = None
        except InsightsError as exc:
            analysis = fallback_analysis()
            ats = fallback_ats()
            suggestions = fallback_suggestions()
            insights_warning = str(exc)
            print(f"[AI WARNING - insights generation] {insights_warning}")

        response = {
            "success": True,
            "filename": file_storage.filename,
            "parsed_data": parsed_data,
            "stats": stats,
            "checklist": checklist,
            "analysis": analysis,
            "ats": ats,
            "suggestions": suggestions,
        }
        if insights_warning:
            response["insights_warning"] = insights_warning

        return jsonify(response), 200

    except FileExtractionError as exc:
        return jsonify({"success": False, "error": str(exc)}), 422
    except Exception as exc:  # noqa: BLE001
        return jsonify({"success": False, "error": f"Unexpected error: {exc}"}), 500
    finally:
        safe_remove(temp_path)


@app.errorhandler(413)
def file_too_large(_error):
    return (
        jsonify(
            {
                "success": False,
                "error": f"File is too large. Maximum allowed size is {Config.MAX_UPLOAD_SIZE_MB}MB.",
            }
        ),
        413,
    )


# ==========================================================
# Phase 2 — Job Description Intelligence
# ==========================================================

@app.route("/jd-match")
def jd_match_page():
    return render_template("jd_match.html", max_size_mb=Config.MAX_UPLOAD_SIZE_MB, active_page="phase2")


@app.route("/api/analyze-match", methods=["POST"])
def analyze_match_route():
    resume_file = request.files.get("resume")
    jd_file = request.files.get("jd_file")
    jd_text_input = request.form.get("jd_text", "")
    jd_input_type = request.form.get("jd_input_type", "file")

    resume_temp_path = None
    jd_temp_path = None

    try:
        resume_extension = validate_file(resume_file)
    except ValidationError as exc:
        return jsonify({"success": False, "error": f"Resume: {exc}"}), 400

    jd_text = None
    if jd_input_type == "text":
        try:
            jd_text = validate_pasted_text(jd_text_input)
        except ValidationError as exc:
            return jsonify({"success": False, "error": f"Job description: {exc}"}), 400
    else:
        try:
            jd_extension = validate_file(jd_file)
        except ValidationError as exc:
            return jsonify({"success": False, "error": f"Job description: {exc}"}), 400

    try:
        resume_temp_filename = f"{uuid.uuid4().hex}.{resume_extension}"
        resume_temp_path = os.path.join(Config.TEMP_UPLOAD_DIR, resume_temp_filename)
        resume_file.save(resume_temp_path)
        resume_text = extract_text(resume_temp_path, resume_extension)

        if jd_input_type != "text":
            jd_temp_filename = f"{uuid.uuid4().hex}.{jd_extension}"
            jd_temp_path = os.path.join(Config.TEMP_UPLOAD_DIR, jd_temp_filename)
            jd_file.save(jd_temp_path)
            jd_text = extract_text(jd_temp_path, jd_extension)

        resume_parsed = parse_resume(resume_text)
        resume_skills = resume_skill_list(resume_parsed)

        # AI call: JD parsing + suggestions + strengths/weak areas
        try:
            ai_result = analyze_jd(resume_text, jd_text)
            parsed_jd = format_parsed_jd(ai_result.get("parsed_jd", {}))
            suggestions = format_suggestions(ai_result.get("optimization_suggestions", []))
            role_compatibility = ai_result.get("role_compatibility", "")
            strengths = ai_result.get("strengths", [])
            weak_areas = ai_result.get("weak_areas", [])
            match_warning = None
        except JDMatchError as exc:
            fallback = fallback_result()
            parsed_jd = format_parsed_jd(fallback["parsed_jd"])
            suggestions = []
            role_compatibility = fallback["role_compatibility"]
            strengths = []
            weak_areas = []
            match_warning = str(exc)
            print(f"[AI WARNING - JD match analysis] {match_warning}")

        # Plain Python: matched/missing skills + keyword coverage + percentage
        matched_skills, missing_skills = match_skills(
            parsed_jd["required_skills"], resume_skills, resume_text
        )
        coverage = keyword_coverage(parsed_jd["keywords"], resume_skills, resume_text)
        match_percentage = calculate_match_percentage(matched_skills, parsed_jd["required_skills"], coverage)

        summary = role_compatibility or "No summary available."
        match = build_match(matched_skills, missing_skills, coverage, match_percentage, summary)

        response = {
            "success": True,
            "resume_filename": resume_file.filename,
            "jd_filename": jd_file.filename if jd_input_type != "text" else None,
            "resume_parsed": resume_parsed,
            "parsed_jd": parsed_jd,
            "match": match,
            "strengths": strengths,
            "weak_areas": weak_areas,
            "optimization_suggestions": suggestions,
        }
        if match_warning:
            response["match_warning"] = match_warning

        return jsonify(response), 200

    except FileExtractionError as exc:
        return jsonify({"success": False, "error": str(exc)}), 422
    except Exception as exc:  # noqa: BLE001
        return jsonify({"success": False, "error": f"Unexpected error: {exc}"}), 500
    finally:
        safe_remove(resume_temp_path)
        safe_remove(jd_temp_path)


if __name__ == "__main__":
    key_map = {
        "groq": Config.GROQ_API_KEY,
        "gemini": Config.GEMINI_API_KEY,
        "openrouter": Config.OPENROUTER_API_KEY,
    }
    active_key = key_map.get(Config.AI_PROVIDER, "")
    print("=" * 60)
    print(f"AI_PROVIDER = {Config.AI_PROVIDER}")
    if active_key:
        print(f"API key detected for '{Config.AI_PROVIDER}': {active_key[:4]}...{active_key[-4:]}")
    else:
        print(f"WARNING: No API key found for '{Config.AI_PROVIDER}'. "
              f"Check your .env file and restart the app after editing it.")
    print("=" * 60)
    app.run(debug=True, port=5000)
