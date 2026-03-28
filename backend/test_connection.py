"""
Run this script from the backend/ directory to verify your Gemini API key works:
    python test_connection.py
"""
import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.services.gemini_client import verify_connection


async def main():
    print("Testing Gemini API connection...")
    result = await verify_connection()
    if result["status"] == "ok":
        print(f"✓ Connected to {result['model']} — response: '{result['response']}'")
    else:
        print(f"✗ Unexpected response: {result['response']}")


if __name__ == "__main__":
    asyncio.run(main())
