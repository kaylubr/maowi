import { apiFetch } from './client'

export const INVITATIONS_QUERY_KEY = ['invitations'] as const

export type Invitation = {
  module_name: string
  owner_username: string | null
}

export type InvitationAcceptance = {
  module_id: number
}

export type ModuleMember = {
  user_id: number
  username: string | null
  avatar_url: string | null
  is_owner: boolean
  joined_at: string | null
}

export type LeaderboardEntry = {
  user_id: number
  username: string | null
  avatar_url: string | null
  is_owner: boolean
  best_score: number | null
  best_mcq_score: number | null
  best_identification_score: number | null
  attempt_count: number
  last_studied_at: string | null
}

export type InviteToken = {
  invite_token: string
}

export function invitationQueryKey(token: string) {
  return [...INVITATIONS_QUERY_KEY, token] as const
}

export function moduleMembersQueryKey(moduleId: number) {
  return ['module', moduleId, 'members'] as const
}

export function moduleLeaderboardQueryKey(moduleId: number) {
  return ['module', moduleId, 'leaderboard'] as const
}

export function fetchInvitation(token: string): Promise<Invitation> {
  return apiFetch<Invitation>(`/api/invitations/${token}`)
}

export function acceptInvitation(token: string): Promise<InvitationAcceptance> {
  return apiFetch<InvitationAcceptance>(`/api/invitations/${token}/accept`, {
    method: 'POST',
  })
}

export function fetchModuleMembers(moduleId: number): Promise<ModuleMember[]> {
  return apiFetch<ModuleMember[]>(`/api/modules/${moduleId}/members`)
}

export function leaveModule(moduleId: number): Promise<null> {
  return apiFetch<null>(`/api/modules/${moduleId}/members/me`, {
    method: 'DELETE',
  })
}

export function removeModuleMember(
  moduleId: number,
  userId: number,
): Promise<null> {
  return apiFetch<null>(`/api/modules/${moduleId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export function regenerateInviteToken(moduleId: number): Promise<InviteToken> {
  return apiFetch<InviteToken>(`/api/modules/${moduleId}/invitation/regenerate`, {
    method: 'POST',
  })
}

export function fetchLeaderboard(
  moduleId: number,
): Promise<LeaderboardEntry[]> {
  return apiFetch<LeaderboardEntry[]>(`/api/modules/${moduleId}/leaderboard`)
}
