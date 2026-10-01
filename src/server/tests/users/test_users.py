from fastapi.testclient import TestClient

PASSWORD = "correct-horse-battery"
ME_PATH = "/api/users/me"


def register(client: TestClient, email: str, username: str):
    return client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": PASSWORD},
    )


def login(client: TestClient, email: str):
    return client.post(
        "/api/auth/login", json={"email": email, "password": PASSWORD}
    )


def update_username(client: TestClient, username: str):
    return client.patch(ME_PATH, json={"username": username})


def test_me_includes_username_and_avatar_url(client):
    register(client, "student@example.com", "student")
    login(client, "student@example.com")

    response = client.get(ME_PATH)

    assert response.status_code == 200
    body = response.json()
    assert "username" in body
    assert "avatar_url" in body


def test_update_username_sets_it_on_the_profile(client):
    register(client, "student@example.com", "student")
    login(client, "student@example.com")

    response = update_username(client, "jane_doe")

    assert response.status_code == 200
    assert response.json()["username"] == "jane_doe"
    assert client.get(ME_PATH).json()["username"] == "jane_doe"


def test_update_username_normalizes_to_lowercase(client):
    register(client, "student@example.com", "student")
    login(client, "student@example.com")

    response = update_username(client, "Jane_Doe")

    assert response.status_code == 200
    assert response.json()["username"] == "jane_doe"


def test_update_username_can_change_it(client):
    register(client, "student@example.com", "student")
    login(client, "student@example.com")

    update_username(client, "jane")
    response = update_username(client, "janet")

    assert response.status_code == 200
    assert response.json()["username"] == "janet"
    assert client.get(ME_PATH).json()["username"] == "janet"


def test_update_username_allows_resaving_the_same_username(client):
    register(client, "student@example.com", "jane")
    login(client, "student@example.com")

    response = update_username(client, "jane")

    assert response.status_code == 200
    assert response.json()["username"] == "jane"


def test_update_username_requires_authentication(client):
    response = update_username(client, "jane")

    assert response.status_code == 401


def test_update_username_rejects_a_taken_username_case_insensitively(client):
    register(client, "jane@example.com", "jane")
    register(client, "bob@example.com", "bob")
    login(client, "bob@example.com")

    response = update_username(client, "JANE")

    assert response.status_code == 409


def test_update_username_rejects_invalid_characters(client):
    register(client, "student@example.com", "student")
    login(client, "student@example.com")

    response = update_username(client, "Jane!")

    assert response.status_code == 422


def test_update_username_rejects_too_short(client):
    register(client, "student@example.com", "student")
    login(client, "student@example.com")

    response = update_username(client, "ab")

    assert response.status_code == 422


def test_update_username_rejects_too_long(client):
    register(client, "student@example.com", "student")
    login(client, "student@example.com")

    response = update_username(client, "a" * 31)

    assert response.status_code == 422
