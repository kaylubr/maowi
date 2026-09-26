import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { FILES_QUERY_KEY } from '../api/files'
import * as modulesApi from '../api/modules'
import type { StudyModule } from '../api/modules'
import { MODULES_QUERY_KEY } from '../api/modules'

const POLL_INTERVAL_MS = 3000

export function hasUnfinishedModules(modules: StudyModule[]): boolean {
  return modules.some(
    (module) => module.status === 'draft' || module.status === 'generating',
  )
}

export function useModules() {
  return useQuery({
    queryKey: MODULES_QUERY_KEY,
    queryFn: modulesApi.listModules,
    refetchInterval: (query) =>
      hasUnfinishedModules(query.state.data ?? []) ? POLL_INTERVAL_MS : false,
  })
}

function invalidateModuleAndFileLists(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY })
}

export function useCreateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, fileIds }: { name: string; fileIds: number[] }) =>
      modulesApi.createModule(name, fileIds),
    onSuccess: () => invalidateModuleAndFileLists(queryClient),
  })
}

export function useRenameModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ moduleId, name }: { moduleId: number; name: string }) =>
      modulesApi.renameModule(moduleId, name),
    onSuccess: () => invalidateModuleAndFileLists(queryClient),
  })
}

export function useMergeModules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      moduleId,
      targetModuleId,
    }: {
      moduleId: number
      targetModuleId: number
    }) => modulesApi.mergeModules(moduleId, targetModuleId),
    onSuccess: () => invalidateModuleAndFileLists(queryClient),
  })
}

export function useGenerateModuleQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: modulesApi.generateModuleQuestions,
    onSuccess: () => invalidateModuleAndFileLists(queryClient),
  })
}
