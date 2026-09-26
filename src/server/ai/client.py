import json
from functools import lru_cache

from google import genai
from google.genai import types

from server.config import settings

MODEL = "gemini-2.5-flash-lite"


@lru_cache
def get_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


def generate_json(prompt: str) -> dict:
    response = get_client().models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(response.text)
