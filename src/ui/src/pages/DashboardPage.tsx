import { useState } from 'react'

import type { UploadedFile } from '../api/files'
import type { StudyModule } from '../api/modules'
import { CreateModuleModal } from '../components/modules/CreateModuleModal'
import { ModuleCard } from '../components/modules/ModuleCard'
import { StudyModeModal } from '../components/modules/StudyModeModal'
import { UploadFilesModal } from '../components/modules/UploadFilesModal'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Modal } from '../components/ui/Modal'
import { ErrorText, Label } from '../components/ui/typography'
import { useDeleteFile, useFiles } from '../hooks/useFiles'
import {
  useDeleteModule,
  useGenerateModuleQuestions,
  useMergeModules,
  useModules,
} from '../hooks/useModules'

type PendingAction =
  | { kind: 'generate'; module: StudyModule }
  | { kind: 'deleteModule'; module: StudyModule }
  | { kind: 'deleteFile'; file: UploadedFile }
  | { kind: 'merge'; source: StudyModule; target: StudyModule }

export function DashboardPage() {
  const modulesQuery = useModules()
  const filesQuery = useFiles()

  const deleteFile = useDeleteFile()
  const deleteModule = useDeleteModule()
  const mergeModules = useMergeModules()
  const generateQuestions = useGenerateModuleQuestions()

  const [showUpload, setShowUpload] = useState(false)
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [studyModule, setStudyModule] = useState<StudyModule | null>(null)
  const [mergeSource, setMergeSource] = useState<StudyModule | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const modules = modulesQuery.data ?? []
  const files = filesQuery.data ?? []
  const mergeTargets = mergeSource
    ? modules.filter((module) => module.id !== mergeSource.id)
    : []

  const startMerge = (module: StudyModule) => {
    setActionError(null)
    setMergeTargetId('')
    setMergeSource(module)
  }

  const continueMerge = () => {
    const target = modules.find((module) => String(module.id) === mergeTargetId)
    if (!mergeSource || !target) {
      return
    }
    setPendingAction({ kind: 'merge', source: mergeSource, target })
    setMergeSource(null)
  }

  const confirmPending = async () => {
    if (!pendingAction) {
      return
    }

    setActionError(null)

    try {
      if (pendingAction.kind === 'generate') {
        await generateQuestions.mutateAsync(pendingAction.module.id)
      } else if (pendingAction.kind === 'deleteFile') {
        await deleteFile.mutateAsync(pendingAction.file.id)
      } else if (pendingAction.kind === 'deleteModule') {
        await deleteModule.mutateAsync(pendingAction.module.id)
      } else {
        await mergeModules.mutateAsync({
          moduleId: pendingAction.source.id,
          targetModuleId: pendingAction.target.id,
        })
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'That action could not be completed.',
      )
      setPendingAction(null)
      return
    }

    setPendingAction(null)
  }

  const confirmation = pendingAction ? describePendingAction(pendingAction) : null

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Your modules</h1>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => setShowCreateModule(true)}>
            New module
          </Button>
          <Button onClick={() => setShowUpload(true)}>Upload files</Button>
        </div>
      </div>

      {actionError ? <ErrorText>{actionError}</ErrorText> : null}

      {modulesQuery.isError ? (
        <ErrorText>{modulesQuery.error.message}</ErrorText>
      ) : null}

      {modulesQuery.isSuccess && modules.length === 0 ? (
        <p className="text-body-secondary">
          No modules yet. Upload your lecture files and they will be grouped by
          topic automatically, or create a module by hand.
        </p>
      ) : null}

      {modules.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onGenerate={(target) =>
                setPendingAction({ kind: 'generate', module: target })
              }
              onStudy={setStudyModule}
              onMerge={startMerge}
              onDelete={(target) =>
                setPendingAction({ kind: 'deleteModule', module: target })
              }
            />
          ))}
        </div>
      ) : null}

      <section className="mt-5">
        <h2 className="h4 mb-3">Your files</h2>

        {filesQuery.isSuccess && files.length === 0 ? (
          <p className="text-body-secondary">
            Nothing uploaded yet. PDF, DOCX and PPTX are supported.
          </p>
        ) : null}

        {files.length > 0 ? (
          <ul className="list-group">
            {files.map((file) => (
              <li
                key={file.id}
                className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2"
              >
                <span className="text-break">{file.filename}</span>
                <span className="d-flex align-items-center gap-2">
                  <span className="badge text-bg-secondary">{file.status}</span>
                  <Button
                    variant="ghost"
                    aria-label={`Delete ${file.filename}`}
                    onClick={() => setPendingAction({ kind: 'deleteFile', file })}
                  >
                    Delete
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <Modal
        open={mergeSource !== null}
        title="Merge module"
        onClose={() => setMergeSource(null)}
      >
        <p className="text-body-secondary">
          Move everything out of “{mergeSource?.name}” and into another module.
          The module you pick keeps its name; “{mergeSource?.name}” is removed.
        </p>

        {mergeTargets.length === 0 ? (
          <p className="text-warning-emphasis">
            You need at least two modules before you can merge.
          </p>
        ) : (
          <div className="mb-3">
            <Label htmlFor="merge-target">Merge into</Label>
            <select
              id="merge-target"
              className="form-select"
              value={mergeTargetId}
              onChange={(event) => setMergeTargetId(event.target.value)}
            >
              <option value="">Choose a module…</option>
              {mergeTargets.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => setMergeSource(null)}>
            Cancel
          </Button>
          <Button onClick={continueMerge} disabled={mergeTargetId === ''}>
            Continue
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmation !== null}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? 'Confirm'}
        busy={isBusy(confirmation?.kind, {
          deleteFile: deleteFile.isPending,
          deleteModule: deleteModule.isPending,
          merge: mergeModules.isPending,
          generate: generateQuestions.isPending,
        })}
        onConfirm={confirmPending}
        onCancel={() => setPendingAction(null)}
      />

      <UploadFilesModal open={showUpload} onClose={() => setShowUpload(false)} />
      <CreateModuleModal
        open={showCreateModule}
        onClose={() => setShowCreateModule(false)}
      />
      <StudyModeModal module={studyModule} onClose={() => setStudyModule(null)} />
    </div>
  )
}

type Confirmation = {
  kind: PendingAction['kind']
  title: string
  message: string
  confirmLabel: string
}

function describePendingAction(action: PendingAction): Confirmation {
  if (action.kind === 'generate') {
    return {
      kind: 'generate',
      title: 'Generate questions',
      message: `Maowi will send the material in “${action.module.name}” to Gemini to write study questions.

This consumes your AI quota and can take a while. Continue?`,
      confirmLabel: 'Generate',
    }
  }

  if (action.kind === 'deleteFile') {
    return {
      kind: 'deleteFile',
      title: 'Delete file',
      message: `Delete “${action.file.filename}” permanently? This cannot be undone.`,
      confirmLabel: 'Delete',
    }
  }

  if (action.kind === 'deleteModule') {
    return {
      kind: 'deleteModule',
      title: 'Delete module',
      message: `Delete “${action.module.name}”? Its questions and attempts are removed, and its files are left unassigned.

This cannot be undone.`,
      confirmLabel: 'Delete',
    }
  }

  return {
    kind: 'merge',
    title: 'Merge modules',
    message: `Merge “${action.source.name}” into “${action.target.name}”?

Every file and question in “${action.source.name}” moves to “${action.target.name}”, and “${action.source.name}” is deleted. This cannot be undone.`,
    confirmLabel: 'Merge',
  }
}

function isBusy(
  kind: PendingAction['kind'] | undefined,
  pending: Record<PendingAction['kind'], boolean>,
): boolean {
  return kind ? pending[kind] : false
}
