import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useUploadFiles } from '../../hooks/useFiles'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const MAX_FILES_PER_UPLOAD = 5
const ACCEPTED_EXTENSIONS = '.pdf,.docx,.pptx'

type UploadFilesModalProps = {
  open: boolean
  onClose: () => void
}

export function UploadFilesModal({ open, onClose }: UploadFilesModalProps) {
  const uploadFiles = useUploadFiles()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<File[]>([])
  const [limitError, setLimitError] = useState<string | null>(null)

  const close = () => {
    setSelected([])
    setLimitError(null)
    uploadFiles.reset()
    onClose()
  }

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? [])

    if (chosen.length > MAX_FILES_PER_UPLOAD) {
      setSelected([])
      setLimitError(
        `You picked ${chosen.length} files. Upload at most ${MAX_FILES_PER_UPLOAD} at a time.`,
      )
      return
    }

    setLimitError(null)
    setSelected(chosen)
  }

  const submit = async () => {
    try {
      await uploadFiles.mutateAsync(selected)
    } catch {
      return
    }
    close()
  }

  return (
    <Modal open={open} title="Upload files" onClose={close}>
      <div className="space-y-4">
        <p className="text-sm text-white/70">
          PDF, DOCX or PPTX. Up to {MAX_FILES_PER_UPLOAD} files per upload — they
          will be grouped into modules automatically once parsed.
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          onChange={selectFiles}
          aria-label="Choose files"
          className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white/20 file:px-3 file:py-1 file:text-white"
        />

        {selected.length > 0 ? (
          <ul className="space-y-1 text-sm text-white/70">
            {selected.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        ) : null}

        {limitError ? (
          <p role="alert" className="text-sm text-red-300">
            {limitError}
          </p>
        ) : null}

        {uploadFiles.isError ? (
          <p role="alert" className="text-sm text-red-300">
            {uploadFiles.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={selected.length === 0 || uploadFiles.isPending}
          >
            {uploadFiles.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
