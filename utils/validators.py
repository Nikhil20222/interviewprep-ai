

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


def validate_pasted_text(text: str, min_length: int = 50) -> str:
    """
    Validates pasted job description text (Phase 2).
    Purely additive - does not affect file-upload validation used in Phase 1.
    Returns the cleaned/stripped text on success, raises ValidationError otherwise.
    """
    if text is None:
        raise ValidationError("No job description text was provided.")

    cleaned = text.strip()
    if len(cleaned) == 0:
        raise ValidationError("Job description text is empty.")

    if len(cleaned) < min_length:
        raise ValidationError(
            f"Job description text is too short. Please paste at least {min_length} characters."
        )

    return cleaned
