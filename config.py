"""
Central configuration for InterviewPrep AI.
All environment variables are read here so the rest of the app
never touches os.environ directly. This makes it easy to add new
providers / settings in later phases without hunting through the code.
"""

import os
import tempfile
from dotenv import load_dotenv

# Load variables from a local .env file into the environment.
# Without this, everything in .env is silently ignored and every
# os.environ.get(...) below returns its default (usually empty string) -
# this was the root cause of AI calls failing with no clear reason.
load_dotenv()


class Config:
    # ---- General ----
    MAX_UPLOAD_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 5))
    MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

    # Vercel serverless functions can only write to /tmp, which is also what
    # tempfile.gettempdir() resolves to on Linux. On Windows/Mac (local dev),
    # it correctly resolves to the OS's own temp folder instead.
    TEMP_UPLOAD_DIR = os.environ.get("TEMP_UPLOAD_DIR", tempfile.gettempdir())

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

    # ---- Request behaviour ----
    AI_TIMEOUT_SECONDS = int(os.environ.get("AI_TIMEOUT_SECONDS", 30))
    AI_MAX_RETRIES = int(os.environ.get("AI_MAX_RETRIES", 2))
