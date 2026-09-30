import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { ModuleSummary } from '../api/dashboard'
import { DASHBOARD_QUERY_KEY } from '../api/dashboard'
import { CreateModuleModal } from '../components/modules/CreateModuleModal'
import { DashboardHero } from '../components/modules/DashboardHero'
import { EmptyModules } from '../components/modules/EmptyModules'
import { ModuleCard } from '../components/modules/ModuleCard'
import { ModuleGridSkeleton } from '../components/modules/ModuleGridSkeleton'
import { StudyModeModal } from '../components/modules/StudyModeModal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { ErrorText } from '../components/ui/typography'
import { useDashboardSummary } from '../hooks/useDashboard'
import {
  useDeleteModule,
  useModuleCreation,
  useStartModuleCreation,
} from '../hooks/useModules'

export function DashboardPage() {
  const queryClient = useQueryClient()
  const summaryQuery = useDashboardSummary()
  const deleteModule = useDeleteModule()
  const startCreation = useStartModuleCreation()

  const [showCreateModule, setShowCreateModule] = useState(false)
  const [creationId, setCreationId] = useState<number | null>(null)
  const [studyModule, setStudyModule] = useState<ModuleSummary | null>(null)
  const [moduleToDelete, setModuleToDelete] = useState<ModuleSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const creation = useModuleCreation(creationId)
  const creationReady = creation.data?.status === 'ready'

  useEffect(() => {
    if (!creationReady) {
      return
    }

    void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
  }, [creationReady, queryClient])

  const summary = summaryQuery.data ?? null
  const modules = summary?.modules ?? []

  const startModuleCreation = async (name: string, files: File[]) => {
    setCreationId(null)

    try {
      const started = await startCreation.mutateAsync({ name, files })
      setCreationId(started.id)
    } catch {
      return
    }
  }

  const openCreateModal = () => {
    setCreationId(null)
    setShowCreateModule(true)
  }

  const closeCreateModal = () => {
    setShowCreateModule(false)
  }

  const confirmDelete = async () => {
    if (moduleToDelete === null) {
      return
    }

    setActionError(null)

    try {
      await deleteModule.mutateAsync(moduleToDelete.id)
    } catch (error) {
      setActionError(readErrorMessage(error))
      setModuleToDelete(null)
      return
    }

    setModuleToDelete(null)
  }

  return (
    <div className="brand-fade">
      <DashboardHero summary={summary} onAdd={openCreateModal} />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h4 mb-0">Your modules</h2>
      </div>

      {actionError ? <ErrorText>{actionError}</ErrorText> : null}

      {summaryQuery.isError ? (
        <ErrorText>{summaryQuery.error.message}</ErrorText>
      ) : null}

      <div aria-busy={summaryQuery.isPending}>
        {summaryQuery.isPending ? <ModuleGridSkeleton /> : null}

        {summaryQuery.isSuccess && modules.length === 0 ? (
          <EmptyModules onAdd={openCreateModal} />
        ) : null}

        {modules.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onStudy={setStudyModule}
                onDelete={setModuleToDelete}
              />
            ))}
          </div>
        ) : null}
      </div>

      <ConfirmModal
        open={moduleToDelete !== null}
        title="Delete module"
        message={
          moduleToDelete
            ? `Delete “${moduleToDelete.name}”? Its questions and attempts are removed.

This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        busy={deleteModule.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setModuleToDelete(null)}
      />

      {showCreateModule ? (
        <CreateModuleModal
          onClose={closeCreateModal}
          creation={creation.data}
          isStarting={startCreation.isPending}
          startError={readErrorMessage(startCreation.error)}
          onStart={startModuleCreation}
        />
      ) : null}

      <StudyModeModal module={studyModule} onClose={() => setStudyModule(null)} />
    </div>
  )
}

function readErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) {
    return null
  }

  return error instanceof Error
    ? error.message
    : 'That action could not be completed.'
}
