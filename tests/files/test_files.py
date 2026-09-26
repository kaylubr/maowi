from fastapi.testclient import TestClient

from server.files.models import File
from server.modules import service as modules_service
from tests.files.fixtures import build_docx, build_pdf, build_pptx

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


def test_upload_requires_authentication(client):
    response = upload(client, [("lecture.pdf", build_pdf("Cells"))])

    assert response.status_code == 401


def test_upload_accepts_pdf_docx_and_pptx(client):
    authenticate(client)

    response = upload(
        client,
        [
            ("lecture.pdf", build_pdf("Mitochondria")),
            ("notes.docx", build_docx("Photosynthesis")),
            ("slides.pptx", build_pptx("Glycolysis")),
        ],
    )

    assert response.status_code == 201
    body = response.json()
    assert [file["file_type"] for file in body] == ["pdf", "docx", "pptx"]
    assert [file["status"] for file in body] == ["uploaded"] * 3


def test_upload_parses_each_file(client):
    authenticate(client)
    created = upload(
        client,
        [
            ("lecture.pdf", build_pdf("Mitochondria")),
            ("notes.docx", build_docx("Photosynthesis")),
            ("slides.pptx", build_pptx("Glycolysis")),
        ],
    ).json()

    statuses = [
        client.get(f"/api/files/{file['id']}/status").json() for file in created
    ]

    assert [entry["status"] for entry in statuses] == ["parsed"] * 3
    assert all(entry["error_message"] is None for entry in statuses)


def test_upload_stores_extracted_text(client, db_session):
    from server.files.models import File

    authenticate(client)
    created = upload(client, [("notes.docx", build_docx("Mitochondria", "Ribosome"))]).json()

    file = db_session.get(File, created[0]["id"])

    assert "Mitochondria" in file.parsed_text
    assert "Ribosome" in file.parsed_text


def test_upload_marks_unparseable_file_failed(client):
    authenticate(client)

    created = upload(client, [("notes.docx", b"this is not a docx")]).json()
    response = client.get(f"/api/files/{created[0]['id']}/status")

    assert response.json()["status"] == "failed"
    assert response.json()["error_message"]


def test_upload_rejects_more_than_five_files(client):
    authenticate(client)
    too_many = [(f"notes-{index}.docx", build_docx("text")) for index in range(6)]

    response = upload(client, too_many)

    assert response.status_code == 400


def test_upload_allows_exactly_five_files(client):
    authenticate(client)
    five = [(f"notes-{index}.docx", build_docx("text")) for index in range(5)]

    response = upload(client, five)

    assert response.status_code == 201
    assert len(response.json()) == 5


def test_upload_rejects_unsupported_file_type(client):
    authenticate(client)

    response = upload(client, [("notes.txt", b"plain text")])

    assert response.status_code == 400


def test_status_hides_other_users_files(client):
    authenticate(client, "owner@example.com")
    created = upload(client, [("notes.docx", build_docx("text"))]).json()
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.get(f"/api/files/{created[0]['id']}/status")

    assert response.status_code == 404


def test_patch_reassigns_module(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")
    created = upload(client, [("notes.docx", build_docx("text"))]).json()

    response = client.patch(
        f"/api/files/{created[0]['id']}", json={"module_id": module.id}
    )

    assert response.status_code == 200
    assert response.json()["module_id"] == module.id


def test_patch_can_clear_module(client, db_session):
    user_id = authenticate(client)
    module = modules_service.create_module(db_session, user_id, "Cell Biology")
    created = upload(client, [("notes.docx", build_docx("text"))]).json()
    client.patch(f"/api/files/{created[0]['id']}", json={"module_id": module.id})

    response = client.patch(f"/api/files/{created[0]['id']}", json={"module_id": None})

    assert response.json()["module_id"] is None


def test_patch_rejects_unknown_module(client):
    authenticate(client)
    created = upload(client, [("notes.docx", build_docx("text"))]).json()

    response = client.patch(
        f"/api/files/{created[0]['id']}", json={"module_id": 9999}
    )

    assert response.status_code == 404


def test_patch_rejects_other_users_module(client, db_session):
    owner_id = authenticate(client, "owner@example.com")
    module = modules_service.create_module(db_session, owner_id, "Owner Module")
    created = upload(client, [("notes.docx", build_docx("text"))]).json()
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.patch(
        f"/api/files/{created[0]['id']}", json={"module_id": module.id}
    )

    assert response.status_code == 404


def test_patch_hides_other_users_files(client):
    authenticate(client, "owner@example.com")
    created = upload(client, [("notes.docx", build_docx("text"))]).json()
    client.cookies.clear()
    authenticate(client, "intruder@example.com")

    response = client.patch(f"/api/files/{created[0]['id']}", json={"module_id": 1})

    assert response.status_code == 404
