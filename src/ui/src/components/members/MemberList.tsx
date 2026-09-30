import { useState } from "react";

import type { ModuleMember } from "../../api/members";
import { useRemoveModuleMember } from "../../hooks/useMembers";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { ErrorText } from "../ui/typography";

type MemberListProps = {
  moduleId: number;
  members: ModuleMember[];
  isOwner: boolean;
};

export function MemberList({ moduleId, members, isOwner }: MemberListProps) {
  const removeMember = useRemoveModuleMember();
  const [memberToRemove, setMemberToRemove] = useState<ModuleMember | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const memberName = (member: ModuleMember) => member.username ?? "Member";

  const confirmRemove = async () => {
    if (memberToRemove === null) {
      return;
    }

    setActionError(null);

    try {
      await removeMember.mutateAsync({
        moduleId,
        userId: memberToRemove.user_id,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "That member could not be removed.",
      );
    }

    setMemberToRemove(null);
  };

  return (
    <div className="card brand-card">
      <div className="card-body">
        <h2 className="h5 mb-3">Members</h2>

        {actionError ? <ErrorText>{actionError}</ErrorText> : null}

        <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="d-flex align-items-center gap-2"
            >
              <Avatar
                userId={member.user_id}
                username={member.username}
                avatarUrl={member.avatar_url}
                size="sm"
              />

              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  <span>{memberName(member)}</span>
                  {member.is_owner ? (
                    <span className="badge text-bg-secondary">Owner</span>
                  ) : null}
                </div>
                {member.joined_at ? (
                  <span className="small text-body-secondary">
                    Joined {formatJoinedDate(member.joined_at)}
                  </span>
                ) : null}
              </div>

              {isOwner && !member.is_owner ? (
                <Button
                  variant="ghost"
                  aria-label={`Remove ${memberName(member)}`}
                  onClick={() => setMemberToRemove(member)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <ConfirmModal
        open={memberToRemove !== null}
        title="Remove member"
        message={
          memberToRemove
            ? `Remove ${memberName(memberToRemove)} from this module? They keep their attempt history but leave the leaderboard.`
            : ""
        }
        confirmLabel="Remove"
        busy={removeMember.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
