
import json
import re
import requests

from config import Config


class AIClientError(Exception):
    """Raised when the configured AI provider fails or returns unusable output."""


def _extract_json(raw_text: str) -> dict:
    """
    Models sometimes wrap JSON in ```json ... ``` fences or add stray
    text around it. This strips that noise and parses the first valid
    JSON object found.
    """
    if not raw_text:
        raise AIClientError("Empty response from AI provider.")

    text = raw_text.strip()
    text = re.sub(r"^```(json)?", "", text.strip(), flags=re.IGNORECASE).strip()
    text = re.sub(r"```$", "", text.strip()).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fall back to grabbing the outermost {...} block
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError as exc:
                raise AIClientError(f"Could not parse AI response as JSON: {exc}")
        raise AIClientError("AI response did not contain valid JSON.")


def _call_groq(system_prompt: str, user_prompt: str) -> str:
    if not Config.GROQ_API_KEY:
        raise AIClientError("GROQ_API_KEY is not set.")

    headers = {
        "Authorization": f"Bearer {Config.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": Config.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    resp = requests.post(
        Config.GROQ_API_URL, headers=headers, json=payload, timeout=Config.AI_TIMEOUT_SECONDS
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    if not Config.GEMINI_API_KEY:
        raise AIClientError("GEMINI_API_KEY is not set.")

    url = f"{Config.GEMINI_API_URL}?key={Config.GEMINI_API_KEY}"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }
    resp = requests.post(url, json=payload, timeout=Config.AI_TIMEOUT_SECONDS)
    resp.raise_for_status()
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def _call_openrouter(system_prompt: str, user_prompt: str) -> str:
    if not Config.OPENROUTER_API_KEY:
        raise AIClientError("OPENROUTER_API_KEY is not set.")

    headers = {
        "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": Config.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
    }
    resp = requests.post(
        Config.OPENROUTER_API_URL,
        headers=headers,
        json=payload,
        timeout=Config.AI_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


_PROVIDERS = {
    "groq": _call_groq,
    "gemini": _call_gemini,
    "openrouter": _call_openrouter,
}


def _dispatch(system_prompt: str, user_prompt: str) -> str:
    provider = Config.AI_PROVIDER
    if provider not in _PROVIDERS:
        raise AIClientError(
            f"Unknown AI_PROVIDER '{provider}'. Must be one of {list(_PROVIDERS)}."
        )

    last_error = None
    for attempt in range(Config.AI_MAX_RETRIES + 1):
        try:
            return _PROVIDERS[provider](system_prompt, user_prompt)
        except Exception as exc:  # noqa: BLE001 - we want to retry on any failure
            last_error = exc
    raise AIClientError(f"AI provider '{provider}' failed after retries: {last_error}")


def generate_json(system_prompt: str, user_prompt: str) -> dict:
    """
    Sends a system + user prompt to the configured AI provider and
    returns a parsed JSON dict. Raises AIClientError on failure so
    callers can decide how to degrade gracefully.
    """
    raw_text = _dispatch(system_prompt, user_prompt)
    return _extract_json(raw_text)
