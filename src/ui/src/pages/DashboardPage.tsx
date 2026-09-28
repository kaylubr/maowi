import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { StudyModule } from '../api/modules'
import { MODULES_QUERY_KEY } from '../api/modules'
import { CreateModuleModal } from '../components/modules/CreateModuleModal'
import { EmptyModules } from '../components/modules/EmptyModules'
import { ModuleCard } from '../components/modules/ModuleCard'
import { ModuleGridSkeleton } from '../components/modules/ModuleGridSkeleton'
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
    <div className="brand-fade">
      <section
        data-bs-theme="dark"
        className="bg-dark text-white brand-card p-4 p-lg-5 mb-4"
      >
        <div className="row align-items-center g-4">
          <div className="col-12 col-lg-7">
            <p className="brand-eyebrow brand-eyebrow-accent mb-2">
              Your study space
            </p>
            <h1 className="display-6 fw-bold mb-2">Welcome back</h1>
            <p className="text-white-50 mb-0">{heroLead(modules.length)}</p>
          </div>

          <div className="col-12 col-lg-5 d-flex justify-content-lg-end">
            <Button onClick={openCreateModal}>Add module</Button>
          </div>
        </div>
      </section>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h4 mb-0">Your modules</h2>
      </div>

      {actionError ? <ErrorText>{actionError}</ErrorText> : null}

      {modulesQuery.isError ? (
        <ErrorText>{modulesQuery.error.message}</ErrorText>
      ) : null}

      <div aria-busy={modulesQuery.isPending}>
        {modulesQuery.isPending ? <ModuleGridSkeleton /> : null}

        {modulesQuery.isSuccess && modules.length === 0 ? (
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

function heroLead(moduleCount: number): string {
  if (moduleCount === 0) {
    return 'Add your lecture files and Maowi turns them into questions you can study.'
  }

  if (moduleCount === 1) {
    return 'You have one module ready to study.'
  }

  return `You have ${moduleCount} modules ready to study.`
}

function readErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) {
    return null
  }

  return error instanceof Error
    ? error.message
    : 'That action could not be completed.'
}
