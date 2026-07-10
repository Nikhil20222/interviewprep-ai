"""
file_cleanup.py
----------------
Small helper to guarantee temp files written to /tmp during a request
are removed afterwards, even on Vercel's serverless filesystem.
"""

import os


def safe_remove(file_path: str) -> None:
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        # Non-fatal: /tmp is ephemeral per-invocation on Vercel anyway.
        pass
