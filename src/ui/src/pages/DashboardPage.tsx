import { useState } from 'react'

import type { UploadedFile } from '../api/files'
import type { StudyModule } from '../api/modules'
import { CreateModuleModal } from '../components/modules/CreateModuleModal'
import { ModuleCard } from '../components/modules/ModuleCard'
import { StudyModeModal } from '../components/modules/StudyModeModal'
import { UploadFilesModal } from '../components/modules/UploadFilesModal'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { GlassCard } from '../components/ui/GlassCard'
import { Modal } from '../components/ui/Modal'
import { useDeleteFile, useFiles } from '../hooks/useFiles'
import {
  useGenerateModuleQuestions,
  useMergeModules,
  useModules,
} from '../hooks/useModules'

const SELECT_CLASSES =
  'w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:border-white/50 [&>option]:text-slate-900'

type PendingAction =
  | { kind: 'generate'; module: StudyModule }
  | { kind: 'deleteFile'; file: UploadedFile }
  | { kind: 'merge'; source: StudyModule; target: StudyModule }

export function DashboardPage() {
  const modulesQuery = useModules()
  const filesQuery = useFiles()

  const deleteFile = useDeleteFile()
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Your modules</h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowCreateModule(true)}>
            New module
          </Button>
          <Button onClick={() => setShowUpload(true)}>Upload files</Button>
        </div>
      </div>

      {actionError ? (
        <p role="alert" className="text-red-300">
          {actionError}
        </p>
      ) : null}

      {modulesQuery.isError ? (
        <p role="alert" className="text-red-300">
          {modulesQuery.error.message}
        </p>
      ) : null}

      {modulesQuery.isSuccess && modules.length === 0 ? (
        <GlassCard>
          <p className="text-white/70">
            No modules yet. Upload your lecture files and they will be grouped by
            topic automatically, or create a module by hand.
          </p>
        </GlassCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onGenerate={(target) =>
              setPendingAction({ kind: 'generate', module: target })
            }
            onStudy={setStudyModule}
            onMerge={startMerge}
          />
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Your files</h2>

        {filesQuery.isSuccess && files.length === 0 ? (
          <GlassCard>
            <p className="text-white/70">
              Nothing uploaded yet. PDF, DOCX and PPTX are supported.
            </p>
          </GlassCard>
        ) : null}

        {files.length > 0 ? (
          <GlassCard className="p-0">
            <ul className="divide-y divide-white/10">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <span className="text-sm text-white">{file.filename}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-white/60">{file.status}</span>
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
          </GlassCard>
        ) : null}
      </section>

      <Modal
        open={mergeSource !== null}
        title="Merge module"
        onClose={() => setMergeSource(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            Move everything out of “{mergeSource?.name}” and into another module.
            The module you pick keeps its name; “{mergeSource?.name}” is removed.
          </p>

          {mergeTargets.length === 0 ? (
            <p className="text-sm text-amber-200">
              You need at least two modules before you can merge.
            </p>
          ) : (
            <div>
              <label
                htmlFor="merge-target"
                className="mb-1 block text-sm text-white/80"
              >
                Merge into
              </label>
              <select
                id="merge-target"
                value={mergeTargetId}
                onChange={(event) => setMergeTargetId(event.target.value)}
                className={SELECT_CLASSES}
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

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setMergeSource(null)}>
              Cancel
            </Button>
            <Button onClick={continueMerge} disabled={mergeTargetId === ''}>
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmation !== null}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? 'Confirm'}
        busy={isBusy(confirmation?.kind, {
          deleteFile: deleteFile.isPending,
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
