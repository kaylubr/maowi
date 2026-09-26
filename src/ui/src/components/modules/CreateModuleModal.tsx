import { useState } from 'react'

import type { UploadedFile } from '../../api/files'
import { useFiles } from '../../hooks/useFiles'
import { useCreateModule } from '../../hooks/useModules'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const INPUT_CLASSES =
  'w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/50'

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
      <div className="space-y-4">
        <div>
          <label htmlFor="module-name" className="mb-1 block text-sm text-white/80">
            Module name
          </label>
          <input
            id="module-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Cell Biology"
            className={INPUT_CLASSES}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-white/80">
            Parsed files not yet in a module
          </legend>

          {assignableFiles.length === 0 ? (
            <p className="text-sm text-white/50">
              No unassigned parsed files. Upload something first.
            </p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {assignableFiles.map((file) => (
                <li key={file.id}>
                  <label className="flex items-center gap-3 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(file.id)}
                      onChange={() => toggleFile(file.id)}
                      className="h-4 w-4"
                    />
                    {file.filename}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        {createModule.isError ? (
          <p role="alert" className="text-sm text-red-300">
            {createModule.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={name.trim() === '' || createModule.isPending}
          >
            {createModule.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
