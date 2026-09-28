import { apiFetch } from './client'

export const MODULES_QUERY_KEY = ['modules'] as const
export const MODULE_CREATIONS_QUERY_KEY = ['moduleCreations'] as const

export type StudyModule = {
  id: number
  name: string
}

export type CreationStatus = 'generating' | 'ready' | 'error'

export type ModuleCreation = {
  id: number
  status: CreationStatus
  module_id: number | null
  error_message: string | null
}

export function listModules(): Promise<StudyModule[]> {
  return apiFetch<StudyModule[]>('/api/modules')
}

export function renameModule(
  moduleId: number,
  name: string,
): Promise<StudyModule> {
  return apiFetch<StudyModule>(`/api/modules/${moduleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteModule(moduleId: number): Promise<null> {
  return apiFetch<null>(`/api/modules/${moduleId}`, { method: 'DELETE' })
}

export function startModuleCreation(
  name: string,
  files: File[],
): Promise<ModuleCreation> {
  const form = new FormData()
  form.append('name', name)
  for (const file of files) {
    form.append('uploads', file)
  }

  return apiFetch<ModuleCreation>('/api/modules/creations', {
    method: 'POST',
    body: form,
  })
}

export function fetchModuleCreation(creationId: number): Promise<ModuleCreation> {
  return apiFetch<ModuleCreation>(`/api/modules/creations/${creationId}`)
}
