import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import type { ModuleCreation } from '../../api/modules'
import { fetchModule, moduleQueryKey } from '../../api/modules'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ErrorText, Label } from '../ui/typography'

const MAX_FILES_PER_UPLOAD = 5
const ACCEPTED_EXTENSIONS = '.pdf,.docx,.pptx'

type CreateModuleModalProps = {
  onClose: () => void
  creation: ModuleCreation | undefined
  isStarting: boolean
  startError: string | null
  onStart: (name: string, files: File[]) => void
}

export function CreateModuleModal({
  onClose,
  creation,
  isStarting,
  startError,
  onStart,
}: CreateModuleModalProps) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<File[]>([])
  const [limitError, setLimitError] = useState<string | null>(null)

  const navigate = useNavigate()
  const readyModuleId = creation?.status === 'ready' ? creation.module_id : null
  const readyModuleQuery = useQuery({
    queryKey: moduleQueryKey(readyModuleId ?? 0),
    queryFn: () => fetchModule(readyModuleId as number),
    enabled: readyModuleId !== null,
  })

  const isGenerating = creation?.status === 'generating'
  const isBusy = isStarting || isGenerating
  const busyLabel = isStarting ? 'Creating…' : 'Writing questions…'
  const errorMessage =
    creation?.status === 'error' ? creation.error_message : startError

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? [])

    if (chosen.length > MAX_FILES_PER_UPLOAD) {
      setSelected([])
      setLimitError(
        `You picked ${chosen.length} files. Use at most ${MAX_FILES_PER_UPLOAD}.`,
      )
      return
    }

    setLimitError(null)
    setSelected(chosen)
  }

  const canSubmit = name.trim() !== '' && selected.length > 0 && !isBusy

  if (readyModuleId !== null) {
    return (
      <ModuleReady
        name={name}
        inviteToken={readyModuleQuery.data?.invite_token ?? null}
        onClose={onClose}
        onGoToModule={() => {
          onClose()
          navigate(`/modules/${readyModuleId}`)
        }}
      />
    )
  }

  return (
    <Modal open title="Add module" onClose={onClose}>
      <div className="mb-3">
        <Label htmlFor="module-name">Module name</Label>
        <Input
          id="module-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Cell Biology"
          disabled={isBusy}
        />
      </div>

      <div className="mb-3">
        <Label htmlFor="module-files">Files</Label>
        <input
          id="module-files"
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          onChange={selectFiles}
          className="form-control"
          disabled={isBusy}
        />
        <div className="form-text">
          PDF, DOCX or PPTX. Up to {MAX_FILES_PER_UPLOAD} files. Maowi reads
          them and writes the study questions.
        </div>
      </div>

      {selected.length > 0 ? (
        <ul className="list-group mb-3">
          {selected.map((file) => (
            <li key={file.name} className="list-group-item text-break">
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}

      {limitError ? <ErrorText>{limitError}</ErrorText> : null}

      {isGenerating ? (
        <p role="status" className="text-body-secondary">
          Reading your files and writing study questions…
        </p>
      ) : null}

      {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isStarting}>
          {isGenerating ? 'Close' : 'Cancel'}
        </Button>
        <Button onClick={() => onStart(name, selected)} disabled={!canSubmit}>
          {isBusy ? busyLabel : 'Create module'}
        </Button>
      </div>
    </Modal>
  )
}

function ModuleReady({
  name,
  inviteToken,
  onClose,
  onGoToModule,
}: {
  name: string
  inviteToken: string | null
  onClose: () => void
  onGoToModule: () => void
}) {
  const link =
    inviteToken === null
      ? null
      : `${window.location.origin}/invite/${inviteToken}`

  return (
    <Modal open title="Module ready" onClose={onClose}>
      <p className="fs-5 mb-2">{`${name} is ready to study.`}</p>
      <p className="text-body-secondary small">
        Invite friends with this link so they can join and compete on the
        leaderboard.
      </p>

      {link ? (
        <Input
          readOnly
          value={link}
          aria-label="Invitation link"
          onFocus={(event) => event.target.select()}
        />
      ) : (
        <p role="status" className="text-body-secondary small mb-0">
          Preparing your invitation link…
        </p>
      )}

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onGoToModule} disabled={link === null}>
          Go to module
        </Button>
      </div>
    </Modal>
  )
}
