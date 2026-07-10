"""
Vercel serverless entry point.

Vercel's Python runtime looks for a WSGI-compatible `app` object in
files under /api. This simply imports the real Flask app defined in
the project root so we don't duplicate any logic here.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app  # noqa: E402,F401
