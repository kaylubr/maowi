from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from server.attempts import service as attempts_service
from server.attempts.models import AttemptMode
from server.members import service as members_service
from server.modules.models import Module
from server.users import service as users_service
from server.tests.fixtures import build_docx

PASSWORD = "correct-horse-battery"
CREATIONS_PATH = "/api/modules/creations"

OWNER_EMAIL = "owner@example.com"
MEMBER_EMAIL = "member@example.com"
STRANGER_EMAIL = "stranger@example.com"

QUESTIONS = [
    {
        "prompt": f"Question {index}",
        "answer": f"Answer {index}",
        "distractors": [f"Wrong {index}a", f"Wrong {index}b", f"Wrong {index}c"],
    }
    for index in range(4)
]


def authenticate(client: TestClient, email: str) -> int:
    username = email.split("@")[0]
    client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": PASSWORD},
    )
    client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return client.get("/api/users/me").json()["id"]


def stub_questions(monkeypatch) -> None:
    from server.questions import generation

    monkeypatch.setattr(
        generation, "generate_json", lambda prompt: {"questions": QUESTIONS}
    )


def create_module(
    client: TestClient, monkeypatch, name: str = "Cell Biology"
) -> dict:
    stub_questions(monkeypatch)
    upload = ("notes.docx", build_docx("Mitochondria"), "application/octet-stream")
    creation = client.post(
        CREATIONS_PATH,
        data={"name": name},
        files=[("uploads", upload)],
    ).json()
    module_id = client.get(f"{CREATIONS_PATH}/{creation['id']}").json()["module_id"]
    return client.get(f"/api/modules/{module_id}").json()


def join_module(client: TestClient, invite_token: str):
    return client.post(f"/api/invitations/{invite_token}/accept")


def module_row(db_session, module_id: int) -> Module:
    module = db_session.get(Module, module_id)
    return module


def record_attempt(
    db_session,
    user_id: int,
    module_id: int,
    correct: int,
    total: int,
    mode: AttemptMode,
    completed_at: datetime,
):
    attempt = attempts_service.create_attempt(
        db_session, user_id, module_id, mode, total
    )
    attempt.score = correct
    attempt.completed_at = completed_at
    db_session.commit()
    return attempt


def test_invitation_is_public(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()

    response = client.get(f"/api/invitations/{module['invite_token']}")

    assert response.status_code == 200
    assert response.json() == {
        "module_name": "Cell Biology",
        "owner_username": "owner",
    }


def test_unknown_invitation_is_not_found(client):
    response = client.get("/api/invitations/unknown-token")

    assert response.status_code == 404
    assert response.json()["detail"] == "Invitation not found"


def test_accept_requires_authentication(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()

    assert join_module(client, module["invite_token"]).status_code == 401


def test_accept_with_an_unknown_token_is_not_found(client):
    authenticate(client, MEMBER_EMAIL)

    assert join_module(client, "unknown-token").status_code == 404


def test_accept_creates_a_membership(client, db_session, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    member_id = authenticate(client, MEMBER_EMAIL)

    response = join_module(client, module["invite_token"])

    assert response.status_code == 201
    assert response.json() == {"module_id": module["id"]}
    member = members_service.get_module_member(db_session, module["id"], member_id)
    assert member is not None
    assert member.joined_at is not None


def test_accept_is_idempotent(client, db_session, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])

    response = join_module(client, module["invite_token"])

    assert response.status_code == 200
    assert response.json() == {"module_id": module["id"]}
    members = members_service.list_members(
        db_session, module_row(db_session, module["id"])
    )
    assert len(members) == 1


def test_accepting_as_the_owner_creates_no_member_row(client, db_session, monkeypatch):
    owner_id = authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)

    response = join_module(client, module["invite_token"])

    assert response.status_code == 200
    assert response.json() == {"module_id": module["id"]}
    assert (
        members_service.get_module_member(db_session, module["id"], owner_id) is None
    )
    members = members_service.list_members(
        db_session, module_row(db_session, module["id"])
    )
    assert members == []


def test_members_list_includes_the_owner_and_members(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])

    response = client.get(f"/api/modules/{module['id']}/members")

    assert response.status_code == 200
    members = response.json()
    assert len(members) == 2
    assert members[0]["is_owner"] is True
    assert members[0]["username"] == "owner"
    assert members[0]["joined_at"] is None
    assert members[1]["is_owner"] is False
    assert members[1]["username"] == "member"
    assert members[1]["joined_at"] is not None
    assert "email" not in members[0]


def test_members_list_hides_strangers(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, STRANGER_EMAIL)

    response = client.get(f"/api/modules/{module['id']}/members")

    assert response.status_code == 404


def test_the_owner_cannot_leave(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)

    response = client.delete(f"/api/modules/{module['id']}/members/me")

    assert response.status_code == 400
    assert response.json()["detail"] == "Owners cannot leave their own module"


def test_leaving_without_a_membership_is_not_found(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, STRANGER_EMAIL)

    response = client.delete(f"/api/modules/{module['id']}/members/me")

    assert response.status_code == 404


def test_a_member_leaves_and_can_rejoin(client, db_session, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    member_id = authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])

    response = client.delete(f"/api/modules/{module['id']}/members/me")

    assert response.status_code == 204
    assert (
        members_service.get_module_member(db_session, module["id"], member_id) is None
    )
    assert join_module(client, module["invite_token"]).status_code == 201


def test_the_owner_removes_a_member(client, db_session, monkeypatch):
    owner_id = authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    member_id = authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])
    client.cookies.clear()
    authenticate(client, OWNER_EMAIL)

    response = client.delete(f"/api/modules/{module['id']}/members/{member_id}")

    assert response.status_code == 204
    members = client.get(f"/api/modules/{module['id']}/members").json()
    assert [member["user_id"] for member in members] == [owner_id]


def test_removing_an_unknown_member_is_not_found(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)

    response = client.delete(f"/api/modules/{module['id']}/members/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Member not found"


def test_only_the_owner_can_remove_members(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])
    client.cookies.clear()
    other_id = authenticate(client, "other@example.com")
    join_module(client, module["invite_token"])
    client.cookies.clear()
    authenticate(client, MEMBER_EMAIL)

    response = client.delete(f"/api/modules/{module['id']}/members/{other_id}")

    assert response.status_code == 404
    members = client.get(f"/api/modules/{module['id']}/members").json()
    assert other_id in [member["user_id"] for member in members]


def test_regenerate_revokes_the_old_invitation_link(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    old_token = module["invite_token"]

    response = client.post(f"/api/modules/{module['id']}/invitation/regenerate")

    assert response.status_code == 200
    new_token = response.json()["invite_token"]
    assert new_token != old_token
    client.cookies.clear()
    assert client.get(f"/api/invitations/{new_token}").status_code == 200
    assert client.get(f"/api/invitations/{old_token}").status_code == 404


def test_only_the_owner_can_regenerate_the_invitation_link(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])

    response = client.post(f"/api/modules/{module['id']}/invitation/regenerate")

    assert response.status_code == 404


def test_leaderboard_requires_authentication(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()

    response = client.get(f"/api/modules/{module['id']}/leaderboard")

    assert response.status_code == 401


def test_leaderboard_hides_strangers(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, STRANGER_EMAIL)

    response = client.get(f"/api/modules/{module['id']}/leaderboard")

    assert response.status_code == 404


def test_leaderboard_ranks_by_best_score_and_reports_mode_bests(
    client, db_session, monkeypatch
):
    owner_id = authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    leader_id = authenticate(client, "leader@example.com")
    join_module(client, module["invite_token"])
    client.cookies.clear()
    idler_id = authenticate(client, "idler@example.com")
    join_module(client, module["invite_token"])
    users_service.update_avatar_url(
        db_session,
        users_service.get_user_by_id(db_session, leader_id),
        "https://cdn.example/leader.png",
    )
    now = datetime.now(timezone.utc).replace(microsecond=0)
    record_attempt(
        db_session, owner_id, module["id"], 3, 4, AttemptMode.mcq, now - timedelta(hours=1)
    )
    record_attempt(
        db_session, leader_id, module["id"], 4, 4, AttemptMode.mcq, now - timedelta(hours=6)
    )
    record_attempt(
        db_session,
        leader_id,
        module["id"],
        2,
        4,
        AttemptMode.identification,
        now - timedelta(hours=4),
    )

    response = client.get(f"/api/modules/{module['id']}/leaderboard")

    assert response.status_code == 200
    rows = response.json()
    assert [row["user_id"] for row in rows] == [leader_id, owner_id, idler_id]
    assert rows[0]["username"] == "leader"
    assert rows[0]["avatar_url"] == "https://cdn.example/leader.png"
    assert rows[0]["is_owner"] is False
    assert rows[0]["best_score"] == 100
    assert rows[0]["best_mcq_score"] == 100
    assert rows[0]["best_identification_score"] == 50
    assert rows[0]["attempt_count"] == 2
    assert (
        datetime.fromisoformat(rows[0]["last_studied_at"])
        == now - timedelta(hours=4)
    )
    assert rows[1]["username"] == "owner"
    assert rows[1]["is_owner"] is True
    assert rows[1]["best_score"] == 75
    assert rows[1]["best_mcq_score"] == 75
    assert rows[1]["best_identification_score"] is None
    assert rows[1]["attempt_count"] == 1
    assert rows[2]["best_score"] is None
    assert rows[2]["best_mcq_score"] is None
    assert rows[2]["attempt_count"] == 0
    assert rows[2]["last_studied_at"] is None
    assert "example.com" not in response.text


def test_leaderboard_ranks_the_earlier_best_attempt_first(
    client, db_session, monkeypatch
):
    owner_id = authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    rival_id = authenticate(client, "rival@example.com")
    join_module(client, module["invite_token"])
    now = datetime.now(timezone.utc).replace(microsecond=0)
    record_attempt(
        db_session,
        owner_id,
        module["id"],
        1,
        4,
        AttemptMode.mcq,
        now - timedelta(hours=10),
    )
    record_attempt(
        db_session,
        owner_id,
        module["id"],
        3,
        4,
        AttemptMode.mcq,
        now - timedelta(hours=2),
    )
    record_attempt(
        db_session,
        rival_id,
        module["id"],
        3,
        4,
        AttemptMode.mcq,
        now - timedelta(hours=5),
    )

    rows = client.get(f"/api/modules/{module['id']}/leaderboard").json()

    assert [row["user_id"] for row in rows] == [rival_id, owner_id]
    assert [row["best_score"] for row in rows] == [75, 75]


def test_leaderboard_puts_zero_attempt_users_last(client, db_session, monkeypatch):
    owner_id = authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    first_id = authenticate(client, "first@example.com")
    join_module(client, module["invite_token"])
    client.cookies.clear()
    second_id = authenticate(client, "second@example.com")
    join_module(client, module["invite_token"])
    now = datetime.now(timezone.utc).replace(microsecond=0)
    record_attempt(
        db_session, owner_id, module["id"], 4, 4, AttemptMode.mcq, now - timedelta(hours=1)
    )

    rows = client.get(f"/api/modules/{module['id']}/leaderboard").json()

    assert [row["user_id"] for row in rows] == [owner_id, first_id, second_id]


def test_leaderboard_keeps_the_owner_ahead_of_zero_attempt_members(
    client, monkeypatch
):
    owner_id = authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    member_id = authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])

    rows = client.get(f"/api/modules/{module['id']}/leaderboard").json()

    assert [row["user_id"] for row in rows] == [owner_id, member_id]
    assert [row["attempt_count"] for row in rows] == [0, 0]


def test_a_member_can_study_the_owners_module(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, MEMBER_EMAIL)
    join_module(client, module["invite_token"])

    questions = client.get(f"/api/modules/{module['id']}/questions?mode=flashcard")
    attempt = client.post(
        "/api/attempts", json={"module_id": module["id"], "mode": "mcq"}
    )

    assert questions.status_code == 200
    assert len(questions.json()) == 4
    assert attempt.status_code == 201


def test_a_stranger_cannot_study_the_owners_module(client, monkeypatch):
    authenticate(client, OWNER_EMAIL)
    module = create_module(client, monkeypatch)
    client.cookies.clear()
    authenticate(client, STRANGER_EMAIL)

    questions = client.get(f"/api/modules/{module['id']}/questions?mode=flashcard")
    attempt = client.post(
        "/api/attempts", json={"module_id": module["id"], "mode": "mcq"}
    )

    assert questions.status_code == 404
    assert attempt.status_code == 404
