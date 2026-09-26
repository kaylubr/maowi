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


def stub_generation(monkeypatch, questions=QUESTIONS) -> None:
    from server.questions import generation

    monkeypatch.setattr(
        generation, "generate_json", lambda prompt: {"questions": questions}
    )


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


def test_generate_requires_a_draft_module(client, db_session, monkeypatch):
    stub_generation(monkeypatch)
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")
    client.post(f"/api/modules/{module.id}/generate")

    response = client.post(f"/api/modules/{module.id}/generate")

    assert response.status_code == 400


def test_generate_marks_module_ready_with_questions(client, db_session, monkeypatch):
    stub_generation(monkeypatch)
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")

    response = client.post(f"/api/modules/{module.id}/generate")

    assert response.status_code == 202
    assert response.json()["status"] == "generating"
    assert client.get(f"/api/modules/{module.id}/status").json()["status"] == "ready"
    questions = client.get(f"/api/modules/{module.id}/questions?mode=flashcard").json()
    assert len(questions) == 5


def test_generate_sends_file_text_to_the_model(client, db_session, monkeypatch):
    from server.questions import generation
    from tests.files.fixtures import build_docx

    prompts = []

    def capture_prompt(prompt):
        prompts.append(prompt)
        return {"questions": QUESTIONS}

    monkeypatch.setattr(generation, "generate_json", capture_prompt)
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")
    file_id = client.post(
        "/api/files",
        files=[("uploads", ("notes.docx", build_docx("Krebs cycle"), "application/octet-stream"))],
    ).json()[0]["id"]
    client.patch(f"/api/files/{file_id}", json={"module_id": module.id})

    client.post(f"/api/modules/{module.id}/generate")

    assert "Krebs cycle" in prompts[0]


def test_generate_marks_module_failed_when_the_model_errors(
    client, db_session, monkeypatch
):
    from server.questions import generation

    def explode(prompt):
        raise RuntimeError("gemini exploded")

    monkeypatch.setattr(generation, "generate_json", explode)
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")

    response = client.post(f"/api/modules/{module.id}/generate")

    assert response.status_code == 202
    status_body = client.get(f"/api/modules/{module.id}/status").json()
    assert status_body["status"] == "failed"
    assert "gemini exploded" in status_body["error_message"]


def test_generate_marks_module_failed_when_no_questions_return(
    client, db_session, monkeypatch
):
    stub_generation(monkeypatch, questions=[])
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")

    client.post(f"/api/modules/{module.id}/generate")

    status_body = client.get(f"/api/modules/{module.id}/status").json()
    assert status_body["status"] == "failed"
    assert status_body["error_message"]


def test_generate_hides_other_users_modules(client, db_session, monkeypatch):
    stub_generation(monkeypatch)
    authenticate(client, "owner@example.com")
    owner_module = modules_service.create_module(db_session, 1, "Owner Module")
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.post(f"/api/modules/{owner_module.id}/generate")

    assert response.status_code == 404
