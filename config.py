
import os


class Config:
    MAX_UPLOAD_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 5))
    MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


    TEMP_UPLOAD_DIR = os.environ.get("TEMP_UPLOAD_DIR", "/tmp")

    # ---- AI Provider selection ----
    # One of: "groq", "gemini", "openrouter"
    AI_PROVIDER = os.environ.get("AI_PROVIDER", "groq").lower()

    # ---- Groq ----
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    # ---- Google Gemini ----
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    GEMINI_API_URL = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )

    # ---- OpenRouter ----
    OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL = os.environ.get(
        "OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free"
    )
    OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

    
    AI_TIMEOUT_SECONDS = int(os.environ.get("AI_TIMEOUT_SECONDS", 30))
    AI_MAX_RETRIES = int(os.environ.get("AI_MAX_RETRIES", 2))
