import { apiFetch } from './client'

export type User = {
  id: number
  email: string
  created_at: string
}

export type Credentials = {
  email: string
  password: string
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

export function register(credentials: Credentials): Promise<User> {
  return apiFetch<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function logout(): Promise<null> {
  return apiFetch<null>('/api/auth/logout', { method: 'POST' })
}
