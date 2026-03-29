try:
    from google import genai as _genai
    _GENAI_AVAILABLE = True
except ImportError:
    _genai = None  # type: ignore
    _GENAI_AVAILABLE = False

from app.config.settings import settings


def get_gemini_client():
    """Returns an authenticated Gemini client using the configured API key."""
    if not _GENAI_AVAILABLE:
        raise ImportError(
            "google-genai package is not installed. "
            "Run: pip install google-genai>=1.14.0"
        )
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not set in environment variables.")
    return _genai.Client(api_key=settings.gemini_api_key)


async def verify_connection() -> dict:
    """
    Sends a minimal prompt to Gemini to confirm the API key and connection work.
    Returns a status dict for use in health checks or startup validation.
    """
    if not _GENAI_AVAILABLE:
        return {"status": "unavailable", "reason": "google-genai not installed"}
    client = get_gemini_client()
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents="Reply with only the word: connected",
    )
    reply = response.text.strip().lower()
    return {
        "status": "ok" if "connected" in reply else "unexpected_response",
        "model": settings.gemini_model,
        "response": reply,
    }
