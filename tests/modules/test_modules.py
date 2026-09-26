from fastapi.testclient import TestClient
from sqlalchemy import select

from server.files.models import File
from server.modules import service as modules_service
from server.modules.models import Module
from server.questions import service as questions_service
from server.questions.models import Question
from tests.files.fixtures import build_docx

GENERATED_QUESTION = {
    "prompt": "What is the capital of Australia?",
    "answer": "Canberra",
    "distractors": ["Sydney", "Melbourne", "Perth"],
}

EMAIL = "student@example.com"
PASSWORD = "correct-horse-battery"


def authenticate(client: TestClient, email: str = EMAIL) -> int:
    client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return client.get("/api/users/me").json()["id"]


def upload(client: TestClient, files: list[tuple[str, bytes]]):
    return client.post(
        "/api/files",
        files=[
            ("uploads", (filename, content, "application/octet-stream"))
            for filename, content in files
        ],
    )


def group_files_into_one_module(monkeypatch, name: str = "Cell Biology") -> None:
    from server.modules import clustering

    def fake_cluster_files(existing_modules, new_files):
        return [
            {"file_id": str(file.id), "new_module_name": name} for file in new_files
        ]

    monkeypatch.setattr(clustering, "cluster_files", fake_cluster_files)


def match_only_existing_module(monkeypatch, module_id: int) -> None:
    from server.modules import clustering

    def fake_cluster_files(existing_modules, new_files):
        return [
            {"file_id": str(file.id), "existing_module_id": str(module_id)}
            for file in new_files
        ]

    monkeypatch.setattr(clustering, "cluster_files", fake_cluster_files)


def test_list_modules_requires_authentication(client):
    assert client.get("/api/modules").status_code == 401


def test_upload_groups_files_into_a_draft_module(client, db_session, monkeypatch):
    group_files_into_one_module(monkeypatch)
    authenticate(client)

    created = upload(
        client,
        [
            ("lecture.docx", build_docx("Mitochondria")),
            ("notes.docx", build_docx("Ribosome")),
        ],
    ).json()

    modules = client.get("/api/modules").json()
    assert len(modules) == 1
    assert modules[0]["name"] == "Cell Biology"
    assert modules[0]["status"] == "draft"

    assigned = [db_session.get(File, entry["id"]).module_id for entry in created]
    assert assigned == [modules[0]["id"], modules[0]["id"]]


def test_upload_puts_same_new_module_name_in_one_module(client, db_session, monkeypatch):
    group_files_into_one_module(monkeypatch, name="Photosynthesis")
    authenticate(client)

    upload(
        client,
        [
            ("a.docx", build_docx("Chlorophyll")),
            ("b.docx", build_docx("Stomata")),
            ("c.docx", build_docx("Thylakoid")),
        ],
    )

    modules = client.get("/api/modules").json()
    assert [module["name"] for module in modules] == ["Photosynthesis"]


def test_upload_matches_existing_module(client, db_session, monkeypatch):
    user_id = authenticate(client)
    existing = modules_service.create_module(db_session, user_id, "Cell Biology")
    match_only_existing_module(monkeypatch, existing.id)

    created = upload(client, [("notes.docx", build_docx("Ribosome"))]).json()

    modules = client.get("/api/modules").json()
    assert [module["id"] for module in modules] == [existing.id]
    assert db_session.get(File, created[0]["id"]).module_id == existing.id


def test_clustering_failure_does_not_break_upload(client, monkeypatch):
    from server.modules import clustering

    def exploding_cluster_files(existing_modules, new_files):
        raise RuntimeError("gemini exploded")

    monkeypatch.setattr(clustering, "cluster_files", exploding_cluster_files)
    authenticate(client)

    response = upload(client, [("notes.docx", build_docx("Ribosome"))])

    assert response.status_code == 201
    assert client.get("/api/modules").json() == []


def test_failed_parse_is_not_clustered(client, db_session, monkeypatch):
    group_files_into_one_module(monkeypatch)
    authenticate(client)

    created = upload(client, [("notes.docx", b"not a docx")]).json()

    assert client.get("/api/modules").json() == []
    assert db_session.get(File, created[0]["id"]).module_id is None


def test_rename_module(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Old Name")

    response = client.patch(f"/api/modules/{module.id}", json={"name": "New Name"})

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_rename_rejects_blank_name(client, db_session):
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


def test_merge_moves_files_and_deletes_source(client, db_session, session_factory):
    user_id = authenticate(client)
    source = modules_service.create_module(db_session, user_id, "Source")
    target = modules_service.create_module(db_session, user_id, "Target")
    file_id = upload(client, [("notes.docx", build_docx("Ribosome"))]).json()[0]["id"]
    client.patch(f"/api/files/{file_id}", json={"module_id": source.id})

    response = client.post(
        f"/api/modules/{source.id}/merge", json={"target_module_id": target.id}
    )

    assert response.status_code == 200
    assert response.json()["id"] == target.id
    assert response.json()["name"] == "Target"

    with session_factory() as fresh_session:
        assert fresh_session.get(File, file_id).module_id == target.id
        assert fresh_session.get(Module, source.id) is None


def test_merge_moves_questions(client, db_session, session_factory):
    user_id = authenticate(client)
    source = modules_service.create_module(db_session, user_id, "Source")
    target = modules_service.create_module(db_session, user_id, "Target")
    questions_service.create_questions(db_session, source, [GENERATED_QUESTION])

    response = client.post(
        f"/api/modules/{source.id}/merge", json={"target_module_id": target.id}
    )

    assert response.status_code == 200
    with session_factory() as fresh_session:
        moved = fresh_session.scalars(
            select(Question).where(Question.module_id == target.id)
        ).all()
        assert len(moved) == 1
        assert moved[0].answer == "Canberra"


def test_merge_rejects_self_target(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Only")

    response = client.post(
        f"/api/modules/{module.id}/merge", json={"target_module_id": module.id}
    )

    assert response.status_code == 400


def test_merge_hides_other_users_target(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    source = modules_service.create_module(db_session, owner_id, "Source")
    client.cookies.clear()
    intruder_id = authenticate(client, "intruder@example.com")
    target = modules_service.create_module(db_session, intruder_id, "Intruder Target")

    response = client.post(
        f"/api/modules/{source.id}/merge", json={"target_module_id": target.id}
    )

    assert response.status_code == 404


def test_module_status(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Module")

    response = client.get(f"/api/modules/{module.id}/status")

    assert response.status_code == 200
    assert response.json() == {
        "id": module.id,
        "status": "draft",
        "error_message": None,
    }
