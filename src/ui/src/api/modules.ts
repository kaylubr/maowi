import { apiFetch } from './client'

export const MODULE_CREATIONS_QUERY_KEY = ['moduleCreations'] as const

export const MODULE_QUERY_KEY = ['module'] as const

export type StudyModule = {
  id: number
  name: string
}

export type ModuleDetail = {
  id: number
  name: string
  is_owner: boolean
  invite_token: string
  member_count: number
}

export function moduleQueryKey(moduleId: number) {
  return [...MODULE_QUERY_KEY, moduleId] as const
}

export function fetchModule(moduleId: number): Promise<ModuleDetail> {
  return apiFetch<ModuleDetail>(`/api/modules/${moduleId}`)
}

export type CreationStatus = 'generating' | 'ready' | 'error'

export type ModuleCreation = {
  id: number
  status: CreationStatus
  module_id: number | null
  error_message: string | null
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
