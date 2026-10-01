from fastapi.testclient import TestClient

from server.auth import google
from server.auth.google import GoogleIdentity, InvalidGoogleCredentialError

EMAIL = "student@example.com"
PASSWORD = "correct-horse-battery"


def stub_identity(
    monkeypatch,
    email: str = EMAIL,
    subject: str = "google-subject",
    email_verified: bool = True,
    name: str | None = None,
    picture: str | None = None,
) -> GoogleIdentity:
    identity = GoogleIdentity(
        subject=subject,
        email=email,
        email_verified=email_verified,
        name=name,
        picture=picture,
    )
    monkeypatch.setattr(google, "verify_google_id_token", lambda credential: identity)
    return identity


def google_login(client: TestClient, credential: str = "google-credential"):
    return client.post("/api/auth/google", json={"credential": credential})


def register(client: TestClient):
    return client.post(
        "/api/auth/register",
        json={"email": EMAIL, "password": PASSWORD, "username": "student"},
    )


def test_google_login_creates_user_and_sets_cookie(client, monkeypatch):
    stub_identity(monkeypatch)

    response = google_login(client)

    assert response.status_code == 200
    assert response.json()["email"] == EMAIL
    cookie_header = response.headers["set-cookie"]
    assert "access_token=" in cookie_header
    assert "HttpOnly" in cookie_header
    assert "SameSite=strict" in cookie_header.replace("samesite", "SameSite")


def test_google_login_establishes_a_session(client, monkeypatch):
    stub_identity(monkeypatch)

    google_login(client)
    response = client.get("/api/users/me")

    assert response.status_code == 200
    assert response.json()["email"] == EMAIL


def test_google_login_reuses_the_linked_user(client, monkeypatch):
    stub_identity(monkeypatch)

    first = google_login(client)
    second = google_login(client)

    assert first.json()["id"] == second.json()["id"]


def test_google_login_links_an_existing_password_account(client, monkeypatch):
    account = register(client).json()
    stub_identity(monkeypatch, subject="new-google-subject")

    response = google_login(client)

    assert response.status_code == 200
    assert response.json()["id"] == account["id"]


def test_google_login_rejects_unverified_email(client, monkeypatch):
    stub_identity(monkeypatch, email_verified=False)

    response = google_login(client)

    assert response.status_code == 403
    assert "set-cookie" not in response.headers


def test_google_login_rejects_invalid_credential(client, monkeypatch):
    def reject(credential):
        raise InvalidGoogleCredentialError()

    monkeypatch.setattr(google, "verify_google_id_token", reject)

    response = google_login(client)

    assert response.status_code == 401
    assert "set-cookie" not in response.headers


def test_google_login_rejects_missing_credential(client):
    response = client.post("/api/auth/google", json={})

    assert response.status_code == 422


def test_password_login_rejects_google_only_account(client, monkeypatch):
    stub_identity(monkeypatch)
    google_login(client)
    client.post("/api/auth/logout")

    response = client.post(
        "/api/auth/login", json={"email": EMAIL, "password": PASSWORD}
    )

    assert response.status_code == 401


def test_google_login_sets_avatar_and_leaves_username_empty(client, monkeypatch):
    stub_identity(monkeypatch, picture="https://example.com/avatar-1.png")

    response = google_login(client)

    assert response.status_code == 200
    body = response.json()
    assert body["username"] is None
    assert body["avatar_url"] == "https://example.com/avatar-1.png"


def test_google_login_refreshes_avatar_url(client, monkeypatch):
    stub_identity(monkeypatch, picture="https://example.com/avatar-1.png")
    google_login(client)
    stub_identity(monkeypatch, picture="https://example.com/avatar-2.png")

    response = google_login(client)

    assert response.status_code == 200
    assert response.json()["avatar_url"] == "https://example.com/avatar-2.png"
