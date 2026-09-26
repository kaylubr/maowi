import pytest
from fastapi.testclient import TestClient

from server.modules import service as modules_service
from server.questions import service as questions_service

EMAIL = "student@example.com"
PASSWORD = "correct-horse-battery"

QUESTIONS = [
    {
        "prompt": "What is the capital of Australia?",
        "answer": "Canberra",
        "distractors": ["Sydney", "Melbourne", "Perth"],
    },
    {
        "prompt": "How many chromosomes do humans have?",
        "answer": "46",
        "distractors": ["23", "44", "48"],
    },
    {
        "prompt": "What is the powerhouse of the cell?",
        "answer": "Mitochondria",
        "distractors": ["Ribosome", "Nucleus", "Golgi"],
    },
]


def authenticate(client: TestClient, email: str = EMAIL) -> int:
    client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return client.get("/api/users/me").json()["id"]


@pytest.fixture
def module(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")
    return module


@pytest.fixture
def questions(client, db_session, module):
    return questions_service.create_questions(db_session, module, QUESTIONS)


def start_attempt(client: TestClient, module_id: int, mode: str = "mcq", **extra):
    return client.post(
        "/api/attempts", json={"module_id": module_id, "mode": mode, **extra}
    )


def test_start_requires_authentication(client, module):
    client.cookies.clear()

    assert start_attempt(client, module.id).status_code == 401


def test_start_creates_an_open_attempt(client, questions, module):
    response = start_attempt(client, module.id)

    assert response.status_code == 201
    body = response.json()
    assert body["module_id"] == module.id
    assert body["mode"] == "mcq"
    assert body["total_questions"] == 3
    assert body["score"] is None
    assert body["completed_at"] is None
    assert body["started_at"]


def test_start_honours_count(client, questions, module):
    response = start_attempt(client, module.id, count=2)

    assert response.json()["total_questions"] == 2


def test_start_rejects_flashcard_mode(client, questions, module):
    response = start_attempt(client, module.id, mode="flashcard")

    assert response.status_code == 422


def test_start_rejects_module_without_questions(client, module):
    response = start_attempt(client, module.id)

    assert response.status_code == 400


def test_start_hides_other_users_modules(client, db_session, questions):
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    assert start_attempt(client, questions[0].module_id).status_code == 404


def test_identification_scoring_is_case_and_space_insensitive(client, questions, module):
    attempt = start_attempt(client, module.id, mode="identification").json()

    response = client.post(
        f"/api/attempts/{attempt['id']}/answers",
        json={"question_id": questions[0].id, "user_answer": "  cAnBeRrA  "},
    )

    assert response.status_code == 200
    assert response.json()["is_correct"] is True


def test_identification_marks_wrong_answer_incorrect(client, questions, module):
    attempt = start_attempt(client, module.id, mode="identification").json()

    response = client.post(
        f"/api/attempts/{attempt['id']}/answers",
        json={"question_id": questions[0].id, "user_answer": "Sydney"},
    )

    assert response.json()["is_correct"] is False


def test_mcq_scoring_matches_the_chosen_option_exactly(client, questions, module):
    correct_attempt = start_attempt(client, module.id).json()
    correct = client.post(
        f"/api/attempts/{correct_attempt['id']}/answers",
        json={"question_id": questions[0].id, "user_answer": "Canberra"},
    )

    case_mismatch_attempt = start_attempt(client, module.id).json()
    case_mismatch = client.post(
        f"/api/attempts/{case_mismatch_attempt['id']}/answers",
        json={"question_id": questions[0].id, "user_answer": "canberra"},
    )

    assert correct.json()["is_correct"] is True
    assert case_mismatch.json()["is_correct"] is False


def test_answering_twice_updates_the_same_answer(client, questions, module):
    attempt = start_attempt(client, module.id).json()
    answer_url = f"/api/attempts/{attempt['id']}/answers"

    client.post(
        answer_url, json={"question_id": questions[0].id, "user_answer": "Sydney"}
    )
    response = client.post(
        answer_url, json={"question_id": questions[0].id, "user_answer": "Canberra"}
    )

    assert response.json()["is_correct"] is True
    detail = client.get(f"/api/attempts/{attempt['id']}").json()
    assert len(detail["answers"]) == 1


def test_answering_a_foreign_question_is_rejected(client, db_session, questions, module):
    other_module = modules_service.create_module(
        db_session, module.user_id, "Other Module"
    )
    other_questions = questions_service.create_questions(
        db_session, other_module, QUESTIONS[:1]
    )
    attempt = start_attempt(client, module.id).json()

    response = client.post(
        f"/api/attempts/{attempt['id']}/answers",
        json={"question_id": other_questions[0].id, "user_answer": "Canberra"},
    )

    assert response.status_code == 400


def test_answering_an_unknown_question_is_rejected(client, questions, module):
    attempt = start_attempt(client, module.id).json()

    response = client.post(
        f"/api/attempts/{attempt['id']}/answers",
        json={"question_id": 9999, "user_answer": "Canberra"},
    )

    assert response.status_code == 400


def test_answering_an_unknown_attempt_is_rejected(client, questions):
    response = client.post(
        "/api/attempts/9999/answers",
        json={"question_id": questions[0].id, "user_answer": "Canberra"},
    )

    assert response.status_code == 404


def test_complete_scores_the_attempt(client, questions, module):
    attempt = start_attempt(client, module.id, mode="identification").json()
    answers = ["Canberra", "46", "nope"]
    for question, answer in zip(questions, answers):
        client.post(
            f"/api/attempts/{attempt['id']}/answers",
            json={"question_id": question.id, "user_answer": answer},
        )

    response = client.post(f"/api/attempts/{attempt['id']}/complete")

    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 2
    assert body["total_questions"] == 3
    assert body["completed_at"] is not None


def test_complete_rejects_a_completed_attempt(client, questions, module):
    attempt = start_attempt(client, module.id).json()
    client.post(f"/api/attempts/{attempt['id']}/complete")

    response = client.post(f"/api/attempts/{attempt['id']}/complete")

    assert response.status_code == 400


def test_answers_are_rejected_after_completion(client, questions, module):
    attempt = start_attempt(client, module.id).json()
    client.post(f"/api/attempts/{attempt['id']}/complete")

    response = client.post(
        f"/api/attempts/{attempt['id']}/answers",
        json={"question_id": questions[0].id, "user_answer": "Canberra"},
    )

    assert response.status_code == 400


def test_get_attempt_returns_answers(client, questions, module):
    attempt = start_attempt(client, module.id, mode="identification").json()
    client.post(
        f"/api/attempts/{attempt['id']}/answers",
        json={"question_id": questions[0].id, "user_answer": "Canberra"},
    )
    client.post(f"/api/attempts/{attempt['id']}/complete")

    response = client.get(f"/api/attempts/{attempt['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 1
    assert body["answers"] == [
        {
            "question_id": questions[0].id,
            "user_answer": "Canberra",
            "is_correct": True,
        }
    ]


def test_get_attempt_hides_other_users_attempts(client, questions, module):
    attempt = start_attempt(client, module.id).json()
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    assert client.get(f"/api/attempts/{attempt['id']}").status_code == 404
