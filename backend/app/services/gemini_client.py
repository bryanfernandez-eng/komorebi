from google import genai
from app.config.settings import settings


def get_gemini_client() -> genai.Client:
    """Returns an authenticated Gemini client using the configured API key."""
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not set in environment variables.")
    return genai.Client(api_key=settings.gemini_api_key)


async def verify_connection() -> dict:
    """
    Sends a minimal prompt to Gemini to confirm the API key and connection work.
    Returns a status dict for use in health checks or startup validation.
    """
    client = get_gemini_client()
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Reply with only the word: connected",
    )
    reply = response.text.strip().lower()
    return {
        "status": "ok" if "connected" in reply else "unexpected_response",
        "model": "gemini-2.0-flash",
        "response": reply,
    }
