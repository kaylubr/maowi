import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as modulesApi from '../api/modules'
import type { ModuleCreation } from '../api/modules'
import { MODULE_CREATIONS_QUERY_KEY, MODULES_QUERY_KEY } from '../api/modules'

const POLL_INTERVAL_MS = 3000

export function isCreationPending(
  creation: ModuleCreation | undefined,
): boolean {
  return creation?.status === 'generating'
}

export function useModules() {
  return useQuery({
    queryKey: MODULES_QUERY_KEY,
    queryFn: modulesApi.listModules,
  })
}

export function useModuleCreation(creationId: number | null) {
  return useQuery({
    queryKey: [...MODULE_CREATIONS_QUERY_KEY, creationId],
    queryFn: () => modulesApi.fetchModuleCreation(creationId as number),
    enabled: creationId !== null,
    refetchInterval: (query) =>
      isCreationPending(query.state.data) ? POLL_INTERVAL_MS : false,
  })
}

export function useStartModuleCreation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, files }: { name: string; files: File[] }) =>
      modulesApi.startModuleCreation(name, files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
    },
  })
}

export function useRenameModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ moduleId, name }: { moduleId: number; name: string }) =>
      modulesApi.renameModule(moduleId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
    },
  })
}

export function useDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: modulesApi.deleteModule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
    },
  })
}
