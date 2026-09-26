import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../api/auth'
import type { Credentials, User } from '../api/auth'
import { isApiError } from '../api/client'

export const CURRENT_USER_QUERY_KEY = ['currentUser'] as const

export function useAuth() {
  const queryClient = useQueryClient()

  const userQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
  })

  const syncSession = (user: User | null) => {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user)
    return queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
  }

  const loginMutation = useMutation({
    mutationFn: (credentials: Credentials) => loginRequest(credentials),
    onSuccess: (user) => syncSession(user),
  })

  const registerMutation = useMutation({
    mutationFn: async (credentials: Credentials) => {
      await registerRequest(credentials)
      return loginRequest(credentials)
    },
    onSuccess: (user) => syncSession(user),
  })

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => syncSession(null),
  })

  const user = userQuery.data ?? null

  return {
    user,
    isAuthenticated: user !== null,
    isUnauthenticated: userQuery.isError && isApiError(userQuery.error, 401),
    isResolvingSession: userQuery.isPending,
    sessionError: userQuery.error,
    refetchSession: userQuery.refetch,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  }
}
