import type { LeaderboardEntry } from "../../api/members";
import { Avatar } from "../ui/Avatar";

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
};

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="card brand-card">
      <div className="card-body">
        <h2 className="h5 mb-3">Leaderboard</h2>

        {entries.length === 0 ? (
          <p className="text-body-secondary mb-0">
            No one has studied this module yet.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Member</th>
                  <th scope="col">Best</th>
                  <th scope="col">MCQ</th>
                  <th scope="col">Identification</th>
                  <th scope="col">Attempts</th>
                  <th scope="col">Last studied</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.user_id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar
                          userId={entry.user_id}
                          username={entry.username}
                          avatarUrl={entry.avatar_url}
                          size="sm"
                        />
                        <span>{entry.username ?? "Member"}</span>
                        {entry.is_owner ? (
                          <span className="badge text-bg-secondary">Owner</span>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ minWidth: "9rem" }}>
                      <BestScore value={entry.best_score} />
                    </td>
                    <td>{formatPercent(entry.best_mcq_score)}</td>
                    <td>{formatPercent(entry.best_identification_score)}</td>
                    <td>{entry.attempt_count}</td>
                    <td>{formatLastStudied(entry.last_studied_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BestScore({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-body-secondary">—</span>;
  }

  return (
    <div className="d-flex align-items-center gap-2">
      <div
        className="progress flex-grow-1"
        role="progressbar"
        aria-label="Best score"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ minWidth: "4rem" }}
      >
        <div
          className="progress-bar"
          style={{ width: `${value}%`, backgroundColor: "var(--brand-accent)" }}
        />
      </div>
      <span className="small text-nowrap">{value}%</span>
    </div>
  );
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function formatLastStudied(iso: string | null): string {
  if (iso === null) {
    return "Not yet";
  }

  return formatRelativeTime(iso);
}

function formatRelativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks}w ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(days / 365)}y ago`;
}
