import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { StudyModule } from '../api/modules'
import { MODULES_QUERY_KEY } from '../api/modules'
import { CreateModuleModal } from '../components/modules/CreateModuleModal'
import { ModuleCard } from '../components/modules/ModuleCard'
import { StudyModeModal } from '../components/modules/StudyModeModal'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { ErrorText } from '../components/ui/typography'
import {
  useDeleteModule,
  useModuleCreation,
  useModules,
  useStartModuleCreation,
} from '../hooks/useModules'

export function DashboardPage() {
  const queryClient = useQueryClient()
  const modulesQuery = useModules()
  const deleteModule = useDeleteModule()
  const startCreation = useStartModuleCreation()

  const [showCreateModule, setShowCreateModule] = useState(false)
  const [creationId, setCreationId] = useState<number | null>(null)
  const [studyModule, setStudyModule] = useState<StudyModule | null>(null)
  const [moduleToDelete, setModuleToDelete] = useState<StudyModule | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const creation = useModuleCreation(creationId)
  const creationReady = creation.data?.status === 'ready'

  useEffect(() => {
    if (!creationReady) {
      return
    }

    void queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
  }, [creationReady, queryClient])

  const modules = modulesQuery.data ?? []

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
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Your modules</h1>
        <Button onClick={openCreateModal}>Add module</Button>
      </div>

      {actionError ? <ErrorText>{actionError}</ErrorText> : null}

      {modulesQuery.isError ? (
        <ErrorText>{modulesQuery.error.message}</ErrorText>
      ) : null}

      {modulesQuery.isSuccess && modules.length === 0 ? (
        <p className="text-body-secondary">
          No modules yet. Add a module with your lecture files and Maowi will
          write the study questions.
        </p>
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

      {showCreateModule && !creationReady ? (
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
