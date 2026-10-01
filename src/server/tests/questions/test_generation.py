import pytest

from server.questions import generation


def test_build_prompt_includes_material():
    prompt = generation.build_prompt("Mitochondria are the powerhouse of the cell")

    assert "Mitochondria are the powerhouse of the cell" in prompt
    assert "exact-answerable" in prompt
    assert "3 plausible wrong-answer distractors" in prompt
    assert "Output schema" in prompt


def test_normalize_question_accepts_valid_candidate():
    normalized = generation.normalize_question(
        {
            "prompt": "  What is the capital of Australia?  ",
            "answer": " Canberra ",
            "distractors": ["Sydney", "Melbourne", "Perth"],
        }
    )

    assert normalized == {
        "prompt": "What is the capital of Australia?",
        "answer": "Canberra",
        "distractors": ["Sydney", "Melbourne", "Perth"],
    }


def test_normalize_question_trims_extra_distractors():
    normalized = generation.normalize_question(
        {
            "prompt": "Question",
            "answer": "Answer",
            "distractors": ["a", "b", "c", "d"],
        }
    )

    assert normalized["distractors"] == ["a", "b", "c"]


@pytest.mark.parametrize(
    "candidate",
    [
        "not-a-dict",
        {},
        {"prompt": "", "answer": "Answer", "distractors": ["a", "b", "c"]},
        {"prompt": "Question", "answer": "", "distractors": ["a", "b", "c"]},
        {"prompt": "Question", "answer": "Answer", "distractors": "nope"},
        {"prompt": "Question", "answer": "Answer", "distractors": ["a", "b"]},
        {"prompt": "Question", "answer": "Answer", "distractors": ["a", "b", "  "]},
    ],
)
def test_normalize_question_rejects_malformed_candidate(candidate):
    assert generation.normalize_question(candidate) is None


def test_generate_questions_filters_out_bad_candidates(monkeypatch):
    monkeypatch.setattr(
        generation,
        "generate_json",
        lambda prompt: {
            "questions": [
                {"prompt": "Good", "answer": "Yes", "distractors": ["a", "b", "c"]},
                {"prompt": "Bad", "answer": "No", "distractors": ["a"]},
            ]
        },
    )

    questions = generation.generate_questions("material")

    assert [question["prompt"] for question in questions] == ["Good"]


@pytest.mark.parametrize("response", [{}, {"questions": None}, {"questions": "nope"}])
def test_generate_questions_tolerates_malformed_response(monkeypatch, response):
    monkeypatch.setattr(generation, "generate_json", lambda prompt: response)

    assert generation.generate_questions("material") == []
