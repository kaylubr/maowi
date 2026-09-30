from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.db.session import get_db
from server.members import service as members_service
from server.members.models import ModuleMember
from server.members.schemas import (
    InvitationAcceptRead,
    InvitationRead,
    InviteTokenRead,
    LeaderboardEntryRead,
    MemberRead,
)
from server.modules import service as modules_service
from server.modules.models import Module
from server.users import service as users_service
from server.users.models import User

router = APIRouter(prefix="/api", tags=["members"])


def get_owned_module(db: Session, user_id: int, module_id: int) -> Module:
    module = modules_service.get_user_module(db, user_id, module_id)
    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    return module


def get_invited_module(db: Session, token: str) -> Module:
    module = modules_service.get_module_by_invite_token(db, token)
    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    return module


def build_member_read(
    user: User, is_owner: bool, joined_at: datetime | None
) -> MemberRead:
    return MemberRead(
        user_id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        is_owner=is_owner,
        joined_at=joined_at,
    )


def build_member_reads(
    module: Module, members: list[ModuleMember], users: dict[int, User]
) -> list[MemberRead]:
    reads = [build_member_read(users[module.user_id], True, None)]
    reads.extend(
        build_member_read(users[member.user_id], False, member.joined_at)
        for member in members
    )
    return reads


@router.get("/invitations/{token}", response_model=InvitationRead)
def read_invitation(token: str, db: Session = Depends(get_db)) -> InvitationRead:
    module = get_invited_module(db, token)
    owner = users_service.get_user_by_id(db, module.user_id)
    return InvitationRead(
        module_name=module.name,
        owner_username=owner.username if owner else None,
    )


@router.post("/invitations/{token}/accept", response_model=InvitationAcceptRead)
def accept_invitation(
    token: str,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InvitationAcceptRead:
    module = get_invited_module(db, token)
    already_joined = members_service.is_owner_or_member(
        db, module, current_user.id
    )
    if not already_joined:
        members_service.add_member(db, module, current_user.id)
        response.status_code = status.HTTP_201_CREATED

    return InvitationAcceptRead(module_id=module.id)


@router.get("/modules/{module_id}/members", response_model=list[MemberRead])
def list_module_members(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MemberRead]:
    module = members_service.get_accessible_module(db, current_user.id, module_id)
    members = members_service.list_members(db, module)
    user_ids = [module.user_id, *[member.user_id for member in members]]
    users = users_service.get_users_by_ids(db, user_ids)
    return build_member_reads(module, members, users)


@router.delete(
    "/modules/{module_id}/members/me",
    status_code=status.HTTP_204_NO_CONTENT,
)
def leave_module(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    module = members_service.get_accessible_module(db, current_user.id, module_id)
    if members_service.is_owner(module, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owners cannot leave their own module",
        )

    member = members_service.get_module_member(db, module.id, current_user.id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    members_service.remove_member(db, module, current_user.id)


@router.delete(
    "/modules/{module_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_module_member(
    module_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    module = get_owned_module(db, current_user.id, module_id)
    member = members_service.get_module_member(db, module.id, user_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    members_service.remove_member(db, module, user_id)


@router.post(
    "/modules/{module_id}/invitation/regenerate",
    response_model=InviteTokenRead,
)
def regenerate_invitation(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InviteTokenRead:
    module = get_owned_module(db, current_user.id, module_id)
    updated = members_service.regenerate_invite_token(db, module)
    return InviteTokenRead(invite_token=updated.invite_token)


@router.get(
    "/modules/{module_id}/leaderboard",
    response_model=list[LeaderboardEntryRead],
)
def read_leaderboard(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[LeaderboardEntryRead]:
    module = members_service.get_accessible_module(db, current_user.id, module_id)
    return members_service.get_leaderboard(db, module)
