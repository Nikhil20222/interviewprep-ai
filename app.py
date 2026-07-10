
import os
import uuid

from flask import Flask, render_template, request, jsonify

from config import Config
from utils.validators import validate_file, ValidationError
from utils.file_cleanup import safe_remove
from services.file_extractor import extract_text, FileExtractionError
from services.resume_parser import parse_resume
from services.insights_generator import generate_insights, InsightsError
from services.resume_analyzer import format_analysis, fallback_analysis
from services.ats_checker import format_ats, fallback_ats
from services.suggestions_generator import format_suggestions, fallback_suggestions

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = Config.MAX_UPLOAD_SIZE_BYTES


@app.route("/")
def index():
    return render_template("index.html", max_size_mb=Config.MAX_UPLOAD_SIZE_MB)


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

        response = {
            "success": True,
            "filename": file_storage.filename,
            "parsed_data": parsed_data,
            "analysis": analysis,
            "ats": ats,
            "suggestions": suggestions,
        }
        if insights_warning:
            response["insights_warning"] = insights_warning

        return jsonify(response), 200

    except FileExtractionError as exc:
        return jsonify({"success": False, "error": str(exc)}), 422
    except Exception as exc:  
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
