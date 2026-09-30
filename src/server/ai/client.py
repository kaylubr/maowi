import json

from groq import Groq
from server.config import settings


_model = "openai/gpt-oss-20b"

_client = Groq(
    api_key=settings.groq_api_key
)
1
def generate_json(prompt: str) -> dict: 
    response = _client.chat.completions.create(
        model=_model,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        response_format={
            "type": "json_object"
        },
        reasoning_effort="low"
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("Returned an empty response")


    return json.loads(content)