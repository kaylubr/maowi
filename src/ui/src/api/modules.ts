import { apiFetch } from './client'

export const MODULES_QUERY_KEY = ['modules'] as const

export type ModuleStatus = 'draft' | 'generating' | 'ready' | 'failed'

export type StudyModule = {
  id: number
  name: string
  status: ModuleStatus
  error_message: string | null
}

export type ModuleStatusRead = {
  id: number
  status: ModuleStatus
  error_message: string | null
}

export function listModules(): Promise<StudyModule[]> {
  return apiFetch<StudyModule[]>('/api/modules')
}

export function createModule(
  name: string,
  fileIds: number[],
): Promise<StudyModule> {
  return apiFetch<StudyModule>('/api/modules', {
    method: 'POST',
    body: JSON.stringify({ name, file_ids: fileIds }),
  })
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

export function mergeModules(
  moduleId: number,
  targetModuleId: number,
): Promise<StudyModule> {
  return apiFetch<StudyModule>(`/api/modules/${moduleId}/merge`, {
    method: 'POST',
    body: JSON.stringify({ target_module_id: targetModuleId }),
  })
}

export function generateModuleQuestions(moduleId: number): Promise<StudyModule> {
  return apiFetch<StudyModule>(`/api/modules/${moduleId}/generate`, {
    method: 'POST',
  })
}

export function fetchModuleStatus(moduleId: number): Promise<ModuleStatusRead> {
  return apiFetch<ModuleStatusRead>(`/api/modules/${moduleId}/status`)
}
