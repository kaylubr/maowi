import { apiFetch } from './client'

export type User = {
  id: number
  email: string
  username: string | null
  avatar_url: string | null
  created_at: string
}

export type Credentials = {
  email: string
  password: string
}

export type Registration = Credentials & {
  username: string
}

export function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/users/me')
}

export function login(credentials: Credentials): Promise<User> {
  return apiFetch<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function register(credentials: Registration): Promise<User> {
  return apiFetch<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function loginWithGoogle(credential: string): Promise<User> {
  return apiFetch<User>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export function logout(): Promise<null> {
  return apiFetch<null>('/api/auth/logout', { method: 'POST' })
}
