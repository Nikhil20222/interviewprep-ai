

import os


def safe_remove(file_path: str) -> None:
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        # Non-fatal: /tmp is ephemeral per-invocation on Vercel anyway.
        pass
