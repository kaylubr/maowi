import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DASHBOARD_QUERY_KEY } from '../api/dashboard'
import {
  acceptInvitation,
  fetchInvitation,
  fetchLeaderboard,
  fetchModuleMembers,
  invitationQueryKey,
  leaveModule,
  moduleLeaderboardQueryKey,
  moduleMembersQueryKey,
  regenerateInviteToken,
  removeModuleMember,
} from '../api/members'
import { fetchModule, moduleQueryKey } from '../api/modules'

function isUsableModuleId(moduleId: number): boolean {
  return Number.isInteger(moduleId) && moduleId > 0
}

export function useModuleDetail(moduleId: number) {
  return useQuery({
    queryKey: moduleQueryKey(moduleId),
    queryFn: () => fetchModule(moduleId),
    enabled: isUsableModuleId(moduleId),
  })
}

export function useModuleLeaderboard(moduleId: number) {
  return useQuery({
    queryKey: moduleLeaderboardQueryKey(moduleId),
    queryFn: () => fetchLeaderboard(moduleId),
    enabled: isUsableModuleId(moduleId),
  })
}

export function useModuleMembers(moduleId: number) {
  return useQuery({
    queryKey: moduleMembersQueryKey(moduleId),
    queryFn: () => fetchModuleMembers(moduleId),
    enabled: isUsableModuleId(moduleId),
  })
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: invitationQueryKey(token),
    queryFn: () => fetchInvitation(token),
    enabled: token !== '',
  })
}

export function useAcceptInvitation() {
  return useMutation({ mutationFn: acceptInvitation })
}

export function useLeaveModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveModule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
    },
  })
}

export function useRemoveModuleMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ moduleId, userId }: { moduleId: number; userId: number }) =>
      removeModuleMember(moduleId, userId),
    onSuccess: (_removed, { moduleId }) => {
      void queryClient.invalidateQueries({ queryKey: moduleQueryKey(moduleId) })
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
    },
  })
}

export function useRegenerateInviteToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateInviteToken,
    onSuccess: (token, moduleId) => {
      queryClient.setQueryData(moduleQueryKey(moduleId), (current) =>
        current === undefined
          ? current
          : { ...current, invite_token: token.invite_token },
      )
    },
  })
}
