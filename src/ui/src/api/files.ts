import { apiFetch } from './client'

export const FILES_QUERY_KEY = ['files'] as const

export type FileStatus = 'uploaded' | 'parsing' | 'parsed' | 'failed'

export type UploadedFile = {
  id: number
  filename: string
  file_type: string
  status: FileStatus
  error_message: string | null
  module_id: number | null
}

export function listFiles(): Promise<UploadedFile[]> {
  return apiFetch<UploadedFile[]>('/api/files')
}

export function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  const form = new FormData()
  for (const file of files) {
    form.append('uploads', file)
  }

  return apiFetch<UploadedFile[]>('/api/files', { method: 'POST', body: form })
}

export function deleteFile(fileId: number): Promise<null> {
  return apiFetch<null>(`/api/files/${fileId}`, { method: 'DELETE' })
}

export function assignFileToModule(
  fileId: number,
  moduleId: number | null,
): Promise<UploadedFile> {
  return apiFetch<UploadedFile>(`/api/files/${fileId}`, {
    method: 'PATCH',
    body: JSON.stringify({ module_id: moduleId }),
  })
}
