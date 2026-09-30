import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { ModuleSummary } from '../api/dashboard'
import { isApiError } from '../api/client'
import { InviteBox } from '../components/members/InviteBox'
import { LeaderboardTable } from '../components/members/LeaderboardTable'
import { MemberList } from '../components/members/MemberList'
import { StudyModeModal } from '../components/modules/StudyModeModal'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Input } from '../components/ui/Input'
import { ErrorText, Label } from '../components/ui/typography'
import { useDashboardSummary } from '../hooks/useDashboard'
import {
  useLeaveModule,
  useModuleDetail,
  useModuleLeaderboard,
  useModuleMembers,
} from '../hooks/useMembers'
import { useDeleteModule, useRenameModule } from '../hooks/useModules'

export function ModulePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const moduleId = Number(id)
  const isValidModuleId = Number.isInteger(moduleId) && moduleId > 0

  const moduleQuery = useModuleDetail(moduleId)
  const leaderboardQuery = useModuleLeaderboard(moduleId)
  const membersQuery = useModuleMembers(moduleId)
  const summaryQuery = useDashboardSummary()

  const renameModule = useRenameModule()
  const deleteModule = useDeleteModule()
  const leaveModule = useLeaveModule()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [studyOpen, setStudyOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (!isValidModuleId) {
    return <ModuleUnavailable />
  }

  if (moduleQuery.isError) {
    return (
      <ModuleUnavailable
        message={
          isApiError(moduleQuery.error, 404)
            ? undefined
            : readErrorMessage(moduleQuery.error)
        }
      />
    )
  }

  if (moduleQuery.data === undefined) {
    return <p className="text-body-secondary">Loading module…</p>
  }

  const detail = moduleQuery.data
  const isOwner = detail.is_owner
  const name = renameModule.data?.name ?? detail.name
  const summary = summaryQuery.data ?? null
  const studyModule: ModuleSummary = summary?.modules.find(
    (entry) => entry.id === moduleId,
  ) ?? {
    id: moduleId,
    name,
    is_owner: isOwner,
    question_count: 0,
    attempt_count: 0,
    best_score: null,
    last_studied_at: null,
  }

  const startEditing = () => {
    setDraft(name)
    setEditing(true)
  }

  const submitRename = async (event: SyntheticEvent) => {
    event.preventDefault()

    const trimmed = draft.trim()
    if (trimmed === '' || trimmed === name) {
      setEditing(false)
      return
    }

    setActionError(null)

    try {
      await renameModule.mutateAsync({ moduleId, name: trimmed })
      setEditing(false)
    } catch (error) {
      setActionError(readErrorMessage(error))
    }
  }

  const confirmDelete = async () => {
    setActionError(null)

    try {
      await deleteModule.mutateAsync(moduleId)
      navigate('/dashboard')
    } catch (error) {
      setActionError(readErrorMessage(error))
      setConfirmingDelete(false)
    }
  }

  const confirmLeave = async () => {
    setActionError(null)

    try {
      await leaveModule.mutateAsync(moduleId)
      navigate('/dashboard')
    } catch (error) {
      setActionError(readErrorMessage(error))
      setConfirmingLeave(false)
    }
  }

  return (
    <div className="brand-fade">
      <BackButton to="/dashboard" />

      <div className="d-flex flex-wrap align-items-center gap-2 my-3">
        {editing ? (
          <form
            onSubmit={submitRename}
            className="d-flex flex-wrap align-items-center gap-2"
          >
            <Label htmlFor="module-name" className="visually-hidden">
              Module name
            </Label>
            <Input
              id="module-name"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button type="submit" disabled={renameModule.isPending}>
              {renameModule.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setEditing(false)}
              disabled={renameModule.isPending}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <h1 className="h3 mb-0">{name}</h1>
            <span className="badge text-bg-secondary">
              {isOwner ? 'Owner' : 'Member'}
            </span>
            {isOwner ? (
              <Button variant="ghost" onClick={startEditing}>
                Edit
              </Button>
            ) : null}
          </>
        )}

        <div className="ms-auto d-flex flex-wrap gap-2">
          <Button onClick={() => setStudyOpen(true)}>Study</Button>
          {isOwner ? (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirmingLeave(true)}
            >
              Leave module
            </Button>
          )}
        </div>
      </div>

      {actionError ? <ErrorText>{actionError}</ErrorText> : null}

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          {leaderboardQuery.data ? (
            <LeaderboardTable entries={leaderboardQuery.data} />
          ) : (
            <div className="card brand-card">
              <div className="card-body">
                <p className="text-body-secondary mb-0">
                  Loading leaderboard…
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
          <InviteBox
            moduleId={moduleId}
            token={detail.invite_token}
            isOwner={isOwner}
          />
          <MemberList
            moduleId={moduleId}
            members={membersQuery.data ?? []}
            isOwner={isOwner}
          />
        </div>
      </div>

      <StudyModeModal
        module={studyOpen ? studyModule : null}
        onClose={() => setStudyOpen(false)}
      />

      <ConfirmModal
        open={confirmingDelete}
        title="Delete module"
        message={`Delete “${name}”? Its questions and attempts are removed.

This cannot be undone.`}
        confirmLabel="Delete"
        busy={deleteModule.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ConfirmModal
        open={confirmingLeave}
        title="Leave module"
        message="You'll keep your attempt history but leave the leaderboard. You can rejoin with the invitation link."
        confirmLabel="Leave module"
        busy={leaveModule.isPending}
        onConfirm={confirmLeave}
        onCancel={() => setConfirmingLeave(false)}
      />
    </div>
  )
}

function ModuleUnavailable({ message }: { message?: string }) {
  return (
    <div className="brand-fade">
      <BackButton to="/dashboard" />
      <div className="card brand-card mt-3">
        <div className="card-body text-center py-5">
          <h1 className="h4 mb-2">
            {message ? 'Something went wrong' : 'Module not found'}
          </h1>
          <p className="text-body-secondary mb-0">
            {message ??
              "This module doesn't exist or you no longer have access to it."}
          </p>
        </div>
      </div>
    </div>
  )
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'That action could not be completed.'
}
