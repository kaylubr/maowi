from fastapi.testclient import TestClient

EMAIL = "student@example.com"
PASSWORD = "correct-horse-battery"
USERNAME = "student"


def register(
    client: TestClient,
    email: str = EMAIL,
    password: str = PASSWORD,
    username: str = USERNAME,
):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "username": username},
    )


def login(client: TestClient, email: str = EMAIL, password: str = PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_register_returns_created_user(client):
    response = register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == EMAIL
    assert "password" not in body
    assert "password_hash" not in body


def test_register_rejects_duplicate_email(client):
    register(client)

    response = register(client)

    assert response.status_code == 409


def test_register_rejects_short_password(client):
    response = register(client, password="short")

    assert response.status_code == 422


def test_register_requires_a_username(client):
    response = client.post(
        "/api/auth/register", json={"email": EMAIL, "password": PASSWORD}
    )

    assert response.status_code == 422


def test_register_rejects_duplicate_username(client):
    register(client, email="first@example.com", username="student")

    response = register(client, email="second@example.com", username="student")

    assert response.status_code == 409


def test_login_sets_http_only_strict_cookie(client):
    register(client)

    response = login(client)

    assert response.status_code == 200
    cookie_header = response.headers["set-cookie"]
    assert "access_token=" in cookie_header
    assert "HttpOnly" in cookie_header
    assert "SameSite=strict" in cookie_header.replace("samesite", "SameSite")


def test_login_rejects_wrong_password(client):
    register(client)

    response = login(client, password="not-the-password")

    assert response.status_code == 401


def test_login_rejects_unknown_email(client):
    response = login(client, email="nobody@example.com")

    assert response.status_code == 401


def test_logout_clears_cookie(client):
    register(client)
    login(client)

    response = client.post("/api/auth/logout")

    assert response.status_code == 204
    assert "access_token=" in response.headers["set-cookie"]


def test_me_requires_authentication(client):
    response = client.get("/api/users/me")

    assert response.status_code == 401


def test_me_returns_current_user_after_login(client):
    register(client)
    login(client)

    response = client.get("/api/users/me")

    assert response.status_code == 200
    assert response.json()["email"] == EMAIL


def test_me_rejects_tampered_cookie(client):
    register(client)
    login(client)
    client.cookies.set("access_token", "not-a-real-token")

    response = client.get("/api/users/me")

    assert response.status_code == 401
