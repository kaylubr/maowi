import { useState } from 'react'

import type { UploadedFile } from '../../api/files'
import { useFiles } from '../../hooks/useFiles'
import { useCreateModule } from '../../hooks/useModules'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ErrorText, Label } from '../ui/typography'

type CreateModuleModalProps = {
  open: boolean
  onClose: () => void
}

function isAssignable(file: UploadedFile): boolean {
  return file.module_id === null && file.status === 'parsed'
}

export function CreateModuleModal({ open, onClose }: CreateModuleModalProps) {
  const { data: files } = useFiles()
  const createModule = useCreateModule()
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const assignableFiles = (files ?? []).filter(isAssignable)

  const close = () => {
    setName('')
    setSelectedIds([])
    createModule.reset()
    onClose()
  }

  const toggleFile = (fileId: number) => {
    setSelectedIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId],
    )
  }

  const submit = async () => {
    try {
      await createModule.mutateAsync({ name, fileIds: selectedIds })
    } catch {
      return
    }
    close()
  }

  return (
    <Modal open={open} title="Create module" onClose={close}>
      <div className="mb-3">
        <Label htmlFor="module-name">Module name</Label>
        <Input
          id="module-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Cell Biology"
        />
      </div>

      <fieldset className="mb-3">
        <legend className="form-label">Parsed files not yet in a module</legend>

        {assignableFiles.length === 0 ? (
          <p className="text-body-secondary small mb-0">
            No unassigned parsed files. Upload something first.
          </p>
        ) : (
          <ul
            className="list-group overflow-auto"
            style={{ maxHeight: '12rem' }}
          >
            {assignableFiles.map((file) => (
              <li key={file.id} className="list-group-item">
                <div className="form-check mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`assign-file-${file.id}`}
                    checked={selectedIds.includes(file.id)}
                    onChange={() => toggleFile(file.id)}
                  />
                  <label
                    className="form-check-label text-break"
                    htmlFor={`assign-file-${file.id}`}
                  >
                    {file.filename}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {createModule.isError ? (
        <ErrorText>{createModule.error.message}</ErrorText>
      ) : null}

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={name.trim() === '' || createModule.isPending}
        >
          {createModule.isPending ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </Modal>
  )
}
