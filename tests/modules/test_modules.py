from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from server.config import settings
from server.modules import service as modules_service
from server.modules.models import Module, ModuleCreation
from server.questions import service as questions_service
from server.questions.models import Question
from tests.fixtures import build_docx

GENERATED_QUESTION = {
    "prompt": "What is the capital of Australia?",
    "answer": "Canberra",
    "distractors": ["Sydney", "Melbourne", "Perth"],
}

EMAIL = "student@example.com"
PASSWORD = "correct-horse-battery"

CREATIONS_PATH = "/api/modules/creations"


def authenticate(client: TestClient, email: str = EMAIL) -> int:
    username = email.split("@")[0]
    client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": PASSWORD},
    )
    client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return client.get("/api/users/me").json()["id"]


def stub_questions(monkeypatch, questions=None) -> None:
    from server.questions import generation

    payload = [GENERATED_QUESTION] if questions is None else questions
    monkeypatch.setattr(
        generation, "generate_json", lambda prompt: {"questions": payload}
    )


def start_creation(
    client: TestClient,
    name: str = "Cell Biology",
    files: list[tuple[str, bytes]] | None = None,
):
    chosen = files or [("notes.docx", build_docx("Mitochondria"))]
    return client.post(
        CREATIONS_PATH,
        data={"name": name},
        files=[
            ("uploads", (filename, content, "application/octet-stream"))
            for filename, content in chosen
        ],
    )


def join_module(client: TestClient, invite_token: str):
    return client.post(f"/api/invitations/{invite_token}/accept")


def test_list_modules_requires_authentication(client):
    assert client.get("/api/modules").status_code == 401


def test_creation_requires_authentication(client):
    response = start_creation(client)

    assert response.status_code == 401


def test_creation_requires_a_name(client):
    authenticate(client)

    response = client.post(
        CREATIONS_PATH,
        files=[("uploads", ("notes.docx", build_docx("x"), "application/octet-stream"))],
    )

    assert response.status_code == 422


def test_creation_rejects_a_blank_name(client):
    authenticate(client)

    assert start_creation(client, name="").status_code == 422


def test_creation_requires_at_least_one_file(client):
    authenticate(client)

    response = client.post(CREATIONS_PATH, data={"name": "Cell Biology"})

    assert response.status_code == 422


def test_creation_rejects_more_than_five_files(client):
    authenticate(client)
    too_many = [(f"notes-{index}.docx", build_docx("x")) for index in range(6)]

    response = start_creation(client, files=too_many)

    assert response.status_code == 400


def test_creation_rejects_an_unsupported_file_type(client):
    authenticate(client)

    response = start_creation(client, files=[("notes.txt", b"plain text")])

    assert response.status_code == 400


def test_creation_rejects_an_oversized_file(client, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_file_bytes", 8)
    authenticate(client)

    response = start_creation(client, files=[("notes.docx", build_docx("x" * 50))])

    assert response.status_code == 400
    assert "notes.docx" in response.json()["detail"]


def test_creation_builds_a_module_with_questions(client, monkeypatch):
    stub_questions(monkeypatch)
    authenticate(client)

    response = start_creation(
        client,
        name="Cell Biology",
        files=[
            ("lecture.docx", build_docx("Mitochondria")),
            ("notes.docx", build_docx("Ribosome")),
        ],
    )

    assert response.status_code == 202
    creation = response.json()
    assert creation["status"] == "generating"

    status = client.get(f"{CREATIONS_PATH}/{creation['id']}").json()
    assert status["status"] == "ready"
    assert status["error_message"] is None
    assert status["module_id"] is not None

    modules = client.get("/api/modules").json()
    assert modules == [
        {"id": status["module_id"], "name": "Cell Biology", "is_owner": True}
    ]

    questions = client.get(
        f"/api/modules/{status['module_id']}/questions?mode=flashcard"
    ).json()
    assert [question["answer"] for question in questions] == ["Canberra"]


def test_creation_sends_parsed_file_text_to_the_model(client, monkeypatch):
    from server.questions import generation

    prompts: list[str] = []

    def capture_prompt(prompt):
        prompts.append(prompt)
        return {"questions": [GENERATED_QUESTION]}

    monkeypatch.setattr(generation, "generate_json", capture_prompt)
    authenticate(client)

    start_creation(client, files=[("notes.docx", build_docx("Krebs cycle"))])

    assert "Krebs cycle" in prompts[0]


def test_creation_marks_error_when_generation_fails(client, monkeypatch):
    from server.questions import generation

    def explode(prompt):
        raise RuntimeError("gemini exploded")

    monkeypatch.setattr(generation, "generate_json", explode)
    authenticate(client)

    creation = start_creation(client).json()
    status = client.get(f"{CREATIONS_PATH}/{creation['id']}").json()

    assert status["status"] == "error"
    assert "gemini exploded" in status["error_message"]
    assert status["module_id"] is None
    assert client.get("/api/modules").json() == []


def test_creation_marks_error_when_no_questions_come_back(client, monkeypatch):
    stub_questions(monkeypatch, questions=[])
    authenticate(client)

    creation = start_creation(client).json()
    status = client.get(f"{CREATIONS_PATH}/{creation['id']}").json()

    assert status["status"] == "error"
    assert status["error_message"]


def test_creation_marks_error_when_a_file_cannot_be_parsed(client):
    authenticate(client)

    creation = start_creation(
        client, files=[("broken.docx", b"this is not a docx")]
    ).json()
    status = client.get(f"{CREATIONS_PATH}/{creation['id']}").json()

    assert status["status"] == "error"
    assert "broken.docx" in status["error_message"]
    assert client.get("/api/modules").json() == []


def test_creation_status_requires_authentication(client, db_session):
    user_id = authenticate(client)
    creation = modules_service.create_creation(db_session, user_id)
    client.cookies.clear()

    response = client.get(f"{CREATIONS_PATH}/{creation.id}")

    assert response.status_code == 401


def test_creation_status_hides_other_users_creations(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    creation = modules_service.create_creation(db_session, owner_id)
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.get(f"{CREATIONS_PATH}/{creation.id}")

    assert response.status_code == 404


def test_reaping_removes_stale_creations(client, db_session, session_factory):
    user_id = authenticate(client)
    creation = modules_service.create_creation(db_session, user_id)
    creation_id = creation.id
    creation.created_at = datetime.now(timezone.utc) - timedelta(hours=2)
    db_session.commit()

    modules_service.reap_stale_creations(db_session)

    with session_factory() as fresh_session:
        assert fresh_session.get(ModuleCreation, creation_id) is None


def test_startup_sweep_marks_orphaned_creations_as_error(client, db_session):
    from server.modules.tasks import sweep_orphaned_creations

    user_id = authenticate(client)
    creation = modules_service.create_creation(db_session, user_id)

    sweep_orphaned_creations()

    db_session.expire_all()
    orphaned = db_session.get(ModuleCreation, creation.id)
    assert orphaned.status == "error"
    assert orphaned.error_message


def test_rename_module(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Old Name")

    response = client.patch(f"/api/modules/{module.id}", json={"name": "New Name"})

    assert response.status_code == 200
    assert response.json() == {
        "id": module.id,
        "name": "New Name",
        "is_owner": True,
    }


def test_rename_rejects_a_blank_name(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Old Name")

    response = client.patch(f"/api/modules/{module.id}", json={"name": ""})

    assert response.status_code == 422


def test_rename_hides_other_users_modules(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.patch(f"/api/modules/{module.id}", json={"name": "Hijacked"})

    assert response.status_code == 404


def test_list_modules_excludes_other_users(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    modules_service.create_module(db_session, owner_id, "Owner Module")
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    assert client.get("/api/modules").json() == []


def test_delete_module_removes_it_and_its_questions(
    client, db_session, session_factory
):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")
    questions_service.create_questions(db_session, module, [GENERATED_QUESTION])
    module_id = module.id

    response = client.delete(f"/api/modules/{module_id}")

    assert response.status_code == 204
    with session_factory() as fresh_session:
        assert fresh_session.get(Module, module_id) is None
        remaining = fresh_session.scalars(
            select(Question).where(Question.module_id == module_id)
        ).all()
        assert remaining == []


def test_delete_module_requires_authentication(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Module")
    client.cookies.clear()

    assert client.delete(f"/api/modules/{module.id}").status_code == 401


def test_delete_hides_other_users_modules(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.delete(f"/api/modules/{module.id}")

    assert response.status_code == 404


def test_module_detail_returns_the_invite_token_to_the_owner(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")

    response = client.get(f"/api/modules/{module.id}")

    assert response.status_code == 200
    assert response.json() == {
        "id": module.id,
        "name": "Cell Biology",
        "is_owner": True,
        "invite_token": module.invite_token,
        "member_count": 0,
    }


def test_module_detail_returns_the_invite_token_to_a_member(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    client.cookies.clear()
    authenticate(client, "member@example.com")
    join_module(client, module.invite_token)

    response = client.get(f"/api/modules/{module.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == module.id
    assert body["name"] == "Owner Module"
    assert body["is_owner"] is False
    assert body["invite_token"] == module.invite_token
    assert body["member_count"] == 1


def test_module_detail_hides_other_users_modules(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    assert client.get(f"/api/modules/{module.id}").status_code == 404


def test_list_modules_includes_joined_modules(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    client.cookies.clear()
    authenticate(client, "member@example.com")
    join_module(client, module.invite_token)

    modules = client.get("/api/modules").json()

    assert modules == [
        {"id": module.id, "name": "Owner Module", "is_owner": False}
    ]


def test_rename_hides_members(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    client.cookies.clear()
    authenticate(client, "member@example.com")
    join_module(client, module.invite_token)

    response = client.patch(f"/api/modules/{module.id}", json={"name": "Hijacked"})

    assert response.status_code == 404


def test_delete_hides_members(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    module_id = module.id
    client.cookies.clear()
    authenticate(client, "member@example.com")
    join_module(client, module.invite_token)

    response = client.delete(f"/api/modules/{module_id}")

    assert response.status_code == 404
