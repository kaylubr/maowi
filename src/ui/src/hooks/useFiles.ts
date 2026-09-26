import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as filesApi from '../api/files'
import type { UploadedFile } from '../api/files'
import { FILES_QUERY_KEY } from '../api/files'
import { MODULES_QUERY_KEY } from '../api/modules'

const POLL_INTERVAL_MS = 3000

export function hasUnfinishedFiles(files: UploadedFile[]): boolean {
  return files.some((file) => file.status === 'uploaded' || file.status === 'parsing')
}

export function useFiles() {
  return useQuery({
    queryKey: FILES_QUERY_KEY,
    queryFn: filesApi.listFiles,
    refetchInterval: (query) =>
      hasUnfinishedFiles(query.state.data ?? []) ? POLL_INTERVAL_MS : false,
  })
}

function invalidateFileAndModuleLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
}

export function useUploadFiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: filesApi.uploadFiles,
    onSuccess: () => invalidateFileAndModuleLists(queryClient),
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: filesApi.deleteFile,
    onSuccess: () => invalidateFileAndModuleLists(queryClient),
  })
}

export function useAssignFileToModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fileId,
      moduleId,
    }: {
      fileId: number
      moduleId: number | null
    }) => filesApi.assignFileToModule(fileId, moduleId),
    onSuccess: () => invalidateFileAndModuleLists(queryClient),
  })
}
