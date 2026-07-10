# InterviewPrep AI — Phase 1

Flask app that lets a user upload a resume (PDF/DOCX/TXT) and instantly get:
1. Resume Preview (structured extracted data)
2. Resume Analyzer (8 quality scores + explanations)
3. ATS Compatibility Check (6 checks with Good / Needs Improvement / Missing)
4. AI Suggestions (current text → improved text, with copy buttons)

## How it works (architecture)

- **Single-page flow.** Upload happens via one AJAX call to `POST /api/analyze-resume`,
  which does extraction → parsing → scoring → ATS check → suggestions in one request
  and returns JSON. The page then renders everything client-side. This avoids needing
  server-side sessions/state across requests, which keeps it simple and reliable on
  Vercel's stateless serverless functions.
- **No persistent storage.** The uploaded file is written to `/tmp` (the only writable
  path on Vercel), processed, and deleted in a `finally` block — nothing is saved to disk
  or a database.
- **Contact fields (email/phone/LinkedIn/GitHub/portfolio) are extracted with regex**,
  not AI, since regex is deterministic and can't hallucinate. Everything that needs
  understanding (skills, education, experience, projects, scores, suggestions) goes
  through the AI provider, with prompts that explicitly forbid inventing information.
- **Multi-provider AI layer.** `services/ai_client.py` abstracts Groq / Gemini /
  OpenRouter behind one `generate_json()` function. Switch providers anytime via the
  `AI_PROVIDER` env var — no code changes needed. This is also what will make Phase 4's
  "Multi-AI Support" easy to add later.
- **2 AI calls per resume** (not 5+): one call parses resume content, one combined call
  returns analyzer scores + ATS check + suggestions together. This keeps the app well
  within free-tier rate limits.

## Project structure

```
interviewprep-ai/
├── app.py                        # Flask app + routes
├── config.py                     # All env vars read in one place
├── vercel.json                   # Vercel routing config
├── requirements.txt
├── .env.example
├── api/
│   └── index.py                  # Vercel serverless entry point
├── services/
│   ├── ai_client.py               # Groq / Gemini / OpenRouter abstraction
│   ├── file_extractor.py          # PDF/DOCX/TXT -> raw text
│   ├── resume_parser.py           # raw text -> structured fields
│   ├── insights_generator.py      # combined AI call (scores + ATS + suggestions)
│   ├── resume_analyzer.py         # formats analyzer score slice
│   ├── ats_checker.py             # formats ATS slice
│   └── suggestions_generator.py   # formats suggestions slice
├── utils/
│   ├── validators.py              # file type/size validation
│   └── file_cleanup.py            # temp file removal
├── templates/
│   ├── base.html
│   └── index.html                 # upload + all result sections
└── static/
    ├── css/style.css
    └── js/main.js                  # drag-drop, fetch, render results
```

## Setup

```bash
cd interviewprep-ai
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

```
AI_PROVIDER=groq          # or gemini / openrouter
GROQ_API_KEY=your_key_here
```

Run locally:

```bash
python app.py
```

Visit `http://localhost:5000`.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import the repo in Vercel.
3. In Vercel's Project Settings → Environment Variables, add:
   - `AI_PROVIDER`
   - `GROQ_API_KEY` and/or `GEMINI_API_KEY` and/or `OPENROUTER_API_KEY`
   - (optional) `GROQ_MODEL`, `GEMINI_MODEL`, `OPENROUTER_MODEL`, `MAX_UPLOAD_SIZE_MB`
4. Deploy. `vercel.json` already routes all traffic to `api/index.py`, which imports
   the Flask app from the project root.

## Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `AI_PROVIDER` | No | `groq` | `groq` \| `gemini` \| `openrouter` |
| `GROQ_API_KEY` | Only if using Groq | — | |
| `GEMINI_API_KEY` | Only if using Gemini | — | |
| `OPENROUTER_API_KEY` | Only if using OpenRouter | — | |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | |
| `OPENROUTER_MODEL` | No | `meta-llama/llama-3.3-70b-instruct:free` | |
| `MAX_UPLOAD_SIZE_MB` | No | `5` | |
| `AI_TIMEOUT_SECONDS` | No | `30` | |
| `AI_MAX_RETRIES` | No | `2` | |

## Dependencies added

- `Flask` — web framework
- `requests` — calls to Groq/Gemini/OpenRouter APIs
- `pdfplumber` — PDF text extraction (pure Python, Vercel-safe)
- `python-docx` — DOCX text extraction (pure Python, Vercel-safe)
- `python-dotenv` — loads `.env` file into environment variables for local dev
  (on Vercel, env vars are set in Project Settings instead, so this has no effect there)

## Graceful degradation

If the AI call fails (bad key, rate limit, network issue), the app doesn't crash:
- Resume parsing falls back to "Not Found" / empty lists for AI-derived fields
  (contact fields still work since those are regex-based).
- Analyzer/ATS/Suggestions fall back to a "could not generate" state, and an
  `insights_warning` field is included in the JSON response so this is easy to
  surface/log/debug.


  ## DEMO
  <img width="1912" height="977" alt="as" src="https://github.com/user-attachments/assets/4abf62a0-e9d1-4345-95b0-f30d0ace5fae" />

  <img width="1907" height="920" alt="sd" src="https://github.com/user-attachments/assets/b5f78e05-98dc-461c-a374-68c587de3293" />


## What's ready for Phase 2+

- `services/ai_client.py` already supports 3 providers — adding a 4th for
  "Multi-AI Support" (Phase 4) is a ~15-line addition.
- `config.py` is the single place new env vars (e.g. Supabase keys in Phase 5) will go.
- The JSON contract returned by `/api/analyze-resume` (`parsed_data`) is exactly what
  Phase 2's "Resume vs JD Match" will need to diff against a parsed job description.
- No auth/history/database yet, as requested — but the stateless, single-request design
  means adding a database write (Phase 5) is additive, not a rewrite.
