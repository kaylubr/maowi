import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  USERNAME_ERROR,
  isValidUsername,
  updateUsername,
} from '../api/users'
import { AuthAlert } from '../components/auth/AuthAlert'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorText, Label } from '../components/ui/typography'
import { useAuth } from '../hooks/useAuth'
import { useDashboardSummary } from '../hooks/useDashboard'

export function ProfilePage() {
  const { user, syncSession } = useAuth()
  const summaryQuery = useDashboardSummary()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const update = useMutation({
    mutationFn: updateUsername,
    onSuccess: (updated) => {
      syncSession(updated)
      setEditing(false)
    },
  })

  if (user === null) {
    return null
  }

  const startEditing = () => {
    setDraft(user.username ?? '')
    update.reset()
    setEditing(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()

    if (!isValidUsername(draft)) {
      return
    }

    update.mutate(draft)
  }

  const summary = summaryQuery.data ?? null

  return (
    <div className="brand-fade">
      <div className="card brand-card mb-4">
        <div className="card-body d-flex flex-column flex-sm-row align-items-center gap-4">
          <Avatar
            userId={user.id}
            username={user.username}
            avatarUrl={user.avatar_url}
            size="lg"
          />

          <div className="flex-grow-1 text-center text-sm-start">
            {editing ? (
              <form onSubmit={submit}>
                <Label htmlFor="username">Username</Label>
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <Input
                    id="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <Button
                      type="submit"
                      disabled={update.isPending || !isValidUsername(draft)}
                    >
                      {update.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(false)}
                      disabled={update.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                {draft.length > 0 && !isValidUsername(draft) ? (
                  <ErrorText>{USERNAME_ERROR}</ErrorText>
                ) : null}
              </form>
            ) : (
              <div className="d-flex flex-column flex-sm-row align-items-center gap-2">
                <h1 className="h4 mb-0">{user.username}</h1>
                <Button variant="ghost" onClick={startEditing}>
                  Edit username
                </Button>
              </div>
            )}

            {update.isError ? <AuthAlert>{update.error.message}</AuthAlert> : null}

            <p className="text-body-secondary mb-0 mt-3">{user.email}</p>
            <p className="text-body-secondary small mb-0">
              Joined {formatJoinedDate(user.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="row row-cols-2 row-cols-lg-4 g-3">
        <StatCard label="Modules" value={summary?.module_count ?? 0} />
        <StatCard label="Questions" value={summary?.question_count ?? 0} />
        <StatCard label="Attempts" value={summary?.attempt_count ?? 0} />
        <StatCard
          label="Average score"
          value={formatScore(summary?.average_score ?? null)}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="col">
      <div className="card brand-card h-100">
        <div className="card-body">
          <div className="brand-eyebrow mb-1">{label}</div>
          <div className="fs-4 fw-bold">{value}</div>
        </div>
      </div>
    </div>
  )
}

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatScore(score: number | null): string {
  return score === null ? '—' : `${score}%`
}
