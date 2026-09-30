from server.ai.client import generate_json

SYSTEM_PROMPT = """You generate study questions from academic material. Every question
must have ONE short, unambiguous, exact-answerable response (a term,
name, date, number, or short phrase) — never a sentence, explanation,
or multi-valid-phrasing answer. This is required, not stylistic.
Return ONLY valid JSON. No markdown fences, no commentary."""

TASK_INSTRUCTIONS = """Generate as many non-redundant, high-quality questions as this
material reasonably supports. A dense chapter might yield 30-50;
a short handout might yield 5-10. Do not pad with trivial or
repetitive questions. Each question must be answerable from the
text alone.

For each question, include 3 plausible wrong-answer distractors of
the same type/category as the correct answer (e.g. if the answer is
a capital city, distractors should be other cities — not unrelated
words)."""

OUTPUT_SCHEMA = """Output schema:
{"questions": [
  {"prompt": "What is the capital of Australia?",
   "answer": "Canberra",
   "distractors": ["Sydney", "Melbourne", "Perth"]}
]}"""

DISTRACTOR_COUNT = 3


def is_non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def normalize_question(candidate: object) -> dict | None:
    if not isinstance(candidate, dict):
        return None

    prompt = candidate.get("prompt")
    answer = candidate.get("answer")
    distractors = candidate.get("distractors")

    if not is_non_empty_string(prompt) or not is_non_empty_string(answer):
        return None
    if not isinstance(distractors, list):
        return None

    cleaned = [
        distractor.strip()
        for distractor in distractors
        if is_non_empty_string(distractor)
    ]
    if len(cleaned) < DISTRACTOR_COUNT:
        return None

    return {
        "prompt": prompt.strip(),
        "answer": answer.strip(),
        "distractors": cleaned[:DISTRACTOR_COUNT],
    }


def build_prompt(parsed_text: str) -> str:
    sections = [
        SYSTEM_PROMPT,
        TASK_INSTRUCTIONS,
        f"Material:\n{parsed_text}",
        OUTPUT_SCHEMA,
    ]
    return "\n\n".join(sections)


def generate_questions(parsed_text: str) -> list[dict]:
    response = generate_json(build_prompt(parsed_text))
    print(response)
    candidates = response.get("questions")
    if not isinstance(candidates, list):
        return []

    normalized = [normalize_question(candidate) for candidate in candidates]
    return [question for question in normalized if question is not None]
