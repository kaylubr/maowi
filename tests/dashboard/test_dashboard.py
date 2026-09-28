from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from server.attempts import service as attempts_service
from server.attempts.models import AttemptMode
from server.modules import service as modules_service
from server.questions import service as questions_service

EMAIL = "student@example.com"
PASSWORD = "correct-horse-battery"

SUMMARY_PATH = "/api/dashboard/summary"

QUESTIONS = [
    {
        "prompt": f"Question {index}",
        "answer": f"Answer {index}",
        "distractors": [f"Wrong {index}a", f"Wrong {index}b", f"Wrong {index}c"],
    }
    for index in range(4)
]

EMPTY_SUMMARY = {
    "module_count": 0,
    "question_count": 0,
    "attempt_count": 0,
    "average_score": None,
    "best_score": None,
    "last_studied_at": None,
    "modules": [],
}


def authenticate(client: TestClient, email: str = EMAIL) -> int:
    client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return client.get("/api/users/me").json()["id"]


def build_module(db_session, user_id: int, name: str, question_count: int = 4):
    module = modules_service.create_module(db_session, user_id, name)
    questions_service.create_questions(db_session, module, QUESTIONS[:question_count])
    return module


def record_attempt(
    db_session,
    user_id: int,
    module,
    correct: int,
    total: int,
    completed_at: datetime,
):
    attempt = attempts_service.create_attempt(
        db_session, user_id, module.id, AttemptMode.mcq, total
    )
    attempt.score = correct
    attempt.completed_at = completed_at
    db_session.commit()
    return attempt


def test_summary_requires_authentication(client):
    assert client.get(SUMMARY_PATH).status_code == 401


def test_summary_is_empty_for_a_new_user(client):
    authenticate(client)

    assert client.get(SUMMARY_PATH).json() == EMPTY_SUMMARY


def test_summary_counts_modules_and_questions(client, db_session):
    user_id = authenticate(client)
    build_module(db_session, user_id, "Cell Biology", question_count=4)
    build_module(db_session, user_id, "Photosynthesis", question_count=2)

    body = client.get(SUMMARY_PATH).json()

    assert body["module_count"] == 2
    assert body["question_count"] == 6


def test_summary_reports_scores_from_completed_attempts(client, db_session):
    user_id = authenticate(client)
    module = build_module(db_session, user_id, "Cell Biology")
    now = datetime.now(timezone.utc)
    record_attempt(db_session, user_id, module, 2, 4, now - timedelta(hours=3))
    record_attempt(db_session, user_id, module, 4, 4, now - timedelta(minutes=5))

    body = client.get(SUMMARY_PATH).json()

    assert body["attempt_count"] == 2
    assert body["average_score"] == 75
    assert body["best_score"] == 100
    assert body["modules"][0]["attempt_count"] == 2
    assert body["modules"][0]["question_count"] == 4
    assert body["modules"][0]["best_score"] == 100
    assert body["modules"][0]["last_studied_at"] is not None


def test_summary_ignores_unfinished_attempts(client, db_session):
    user_id = authenticate(client)
    module = build_module(db_session, user_id, "Cell Biology")
    attempts_service.create_attempt(
        db_session, user_id, module.id, AttemptMode.mcq, 4
    )

    body = client.get(SUMMARY_PATH).json()

    assert body["attempt_count"] == 0
    assert body["average_score"] is None
    assert body["best_score"] is None
    assert body["modules"][0]["attempt_count"] == 0
    assert body["modules"][0]["last_studied_at"] is None


def test_summary_orders_studied_modules_first(client, db_session):
    user_id = authenticate(client)
    build_module(db_session, user_id, "Never studied")
    older = build_module(db_session, user_id, "Older")
    recent = build_module(db_session, user_id, "Recent")
    now = datetime.now(timezone.utc)
    record_attempt(db_session, user_id, older, 1, 4, now - timedelta(days=2))
    record_attempt(db_session, user_id, recent, 1, 4, now - timedelta(hours=1))

    body = client.get(SUMMARY_PATH).json()

    assert [module["name"] for module in body["modules"]] == [
        "Recent",
        "Older",
        "Never studied",
    ]


def test_summary_orders_unstudied_modules_newest_first(client, db_session):
    user_id = authenticate(client)
    build_module(db_session, user_id, "First")
    build_module(db_session, user_id, "Second")

    body = client.get(SUMMARY_PATH).json()

    assert [module["name"] for module in body["modules"]] == ["Second", "First"]


def test_summary_excludes_other_users(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    owner_module = build_module(db_session, owner_id, "Owner Module")
    record_attempt(
        db_session, owner_id, owner_module, 4, 4, datetime.now(timezone.utc)
    )
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    body = client.get(SUMMARY_PATH).json()

    assert body == EMPTY_SUMMARY
