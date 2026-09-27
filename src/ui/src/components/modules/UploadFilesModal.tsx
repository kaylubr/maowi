import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useUploadFiles } from '../../hooks/useFiles'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ErrorText } from '../ui/typography'

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
      <p className="text-body-secondary">
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
        className="form-control"
      />

      {selected.length > 0 ? (
        <ul className="list-group mt-3">
          {selected.map((file) => (
            <li key={file.name} className="list-group-item text-break">
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}

      {limitError ? <ErrorText className="mt-3">{limitError}</ErrorText> : null}

      {uploadFiles.isError ? (
        <ErrorText className="mt-3">{uploadFiles.error.message}</ErrorText>
      ) : null}

      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={selected.length === 0 || uploadFiles.isPending}
        >
          {uploadFiles.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </Modal>
  )
}
