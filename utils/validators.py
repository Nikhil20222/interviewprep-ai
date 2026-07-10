"""
validators.py
-------------
File validation helpers: extension, size, and empty-file checks.
Kept separate from routes so validation rules can be reused/tested
independently and extended in later phases (e.g. JD uploads in Phase 2).
"""

import os
from config import Config


class ValidationError(Exception):
    """Raised when an uploaded file fails validation."""


def get_extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1].lower()


def validate_file(file_storage) -> str:
    """
    Validates a Flask FileStorage object.
    Returns the lowercase extension on success, raises ValidationError otherwise.
    """
    if file_storage is None or file_storage.filename == "":
        raise ValidationError("No file was selected.")

    extension = get_extension(file_storage.filename)
    if extension not in Config.ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(Config.ALLOWED_EXTENSIONS)).upper()
        raise ValidationError(f"Unsupported file type. Allowed types: {allowed}")

    # Determine file size without loading the whole file into memory
    file_storage.stream.seek(0, os.SEEK_END)
    size_bytes = file_storage.stream.tell()
    file_storage.stream.seek(0)

    if size_bytes == 0:
        raise ValidationError("Uploaded file is empty.")

    if size_bytes > Config.MAX_UPLOAD_SIZE_BYTES:
        raise ValidationError(
            f"File is too large. Maximum allowed size is {Config.MAX_UPLOAD_SIZE_MB}MB."
        )

    return extension
