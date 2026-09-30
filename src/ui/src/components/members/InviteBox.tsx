import { useEffect, useRef, useState } from "react";

import { useRegenerateInviteToken } from "../../hooks/useMembers";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Input } from "../ui/Input";

type InviteBoxProps = {
  moduleId: number;
  token: string;
  isOwner: boolean;
};

const COPIED_FEEDBACK_MS = 2000;

export function InviteBox({ moduleId, token, isOwner }: InviteBoxProps) {
  const regenerate = useRegenerateInviteToken();
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayToken, setDisplayToken] = useState(token);
  const [copied, setCopied] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  const link = `${window.location.origin}/invite/${displayToken}`;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    const input = inputRef.current;

    try {
      if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(link);
      } else {
        input?.select();
      }
      setCopied(true);
    } catch {
      input?.select();
    }
  };

  const confirmRegenerate = async () => {
    try {
      const result = await regenerate.mutateAsync(moduleId);
      setDisplayToken(result.invite_token);
    } finally {
      setConfirmingRegenerate(false);
    }
  };

  return (
    <div className="card brand-card">
      <div className="card-body">
        <h2 className="h5 mb-2">Invite friends</h2>
        <p className="text-body-secondary small">
          Share this link so friends can join this module as members and
          compete on the leaderboard.
        </p>

        <label className="form-label" htmlFor="invite-link">
          Invitation link
        </label>
        <Input
          id="invite-link"
          ref={inputRef}
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
        />

        <div className="d-flex flex-wrap gap-2 mt-3">
          <Button onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</Button>
          {isOwner ? (
            <Button
              variant="ghost"
              onClick={() => setConfirmingRegenerate(true)}
            >
              Regenerate link
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        open={confirmingRegenerate}
        title="Regenerate link"
        message="This revokes the current link. Anyone with it will no longer be able to join."
        confirmLabel="Regenerate"
        busy={regenerate.isPending}
        onConfirm={confirmRegenerate}
        onCancel={() => setConfirmingRegenerate(false)}
      />
    </div>
  );
}
