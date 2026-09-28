import pytest
from fastapi.testclient import TestClient

from server.modules import service as modules_service
from server.questions import service as questions_service

EMAIL = "student@example.com"
PASSWORD = "correct-horse-battery"

QUESTIONS = [
    {
        "prompt": f"Question {index}",
        "answer": f"Answer {index}",
        "distractors": [f"Wrong {index}a", f"Wrong {index}b", f"Wrong {index}c"],
    }
    for index in range(5)
]


def authenticate(client: TestClient, email: str = EMAIL) -> int:
    client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return client.get("/api/users/me").json()["id"]


@pytest.fixture
def module_with_questions(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")
    questions_service.create_questions(db_session, module, QUESTIONS)
    return module


def test_questions_require_authentication(client, module_with_questions):
    client.cookies.clear()

    response = client.get(f"/api/modules/{module_with_questions.id}/questions?mode=mcq")

    assert response.status_code == 401


def test_flashcard_returns_prompt_and_answer(client, module_with_questions):
    response = client.get(
        f"/api/modules/{module_with_questions.id}/questions?mode=flashcard"
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 5
    assert set(body[0]) == {"id", "prompt", "answer"}
    assert body[0]["answer"] == "Answer 0"


def test_mcq_returns_shuffled_options_containing_the_answer(client, module_with_questions):
    module_id = module_with_questions.id
    answers = {
        question["id"]: question["answer"]
        for question in client.get(
            f"/api/modules/{module_id}/questions?mode=flashcard"
        ).json()
    }

    response = client.get(f"/api/modules/{module_id}/questions?mode=mcq")

    assert response.status_code == 200
    for question in response.json():
        assert set(question) == {"id", "prompt", "options"}
        assert len(question["options"]) == 4
        assert answers[question["id"]] in question["options"]


def test_identification_withholds_the_answer(client, module_with_questions):
    response = client.get(
        f"/api/modules/{module_with_questions.id}/questions?mode=identification"
    )

    assert response.status_code == 200
    for question in response.json():
        assert set(question) == {"id", "prompt"}


def test_count_limits_returned_questions(client, module_with_questions):
    response = client.get(
        f"/api/modules/{module_with_questions.id}/questions?mode=flashcard&count=2"
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert len({question["id"] for question in body}) == 2


def test_count_larger_than_pool_returns_everything(client, module_with_questions):
    response = client.get(
        f"/api/modules/{module_with_questions.id}/questions?mode=flashcard&count=99"
    )

    assert len(response.json()) == 5


def test_rejects_unknown_mode(client, module_with_questions):
    response = client.get(
        f"/api/modules/{module_with_questions.id}/questions?mode=essay"
    )

    assert response.status_code == 422


def test_questions_hide_other_users_modules(client, db_session):
    authenticate(client, "owner@example.com")
    owner_module = modules_service.create_module(db_session, 1, "Owner Module")
    questions_service.create_questions(db_session, owner_module, QUESTIONS)
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.get(f"/api/modules/{owner_module.id}/questions?mode=mcq")

    assert response.status_code == 404
