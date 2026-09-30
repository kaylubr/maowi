import type { User } from './auth'
import { apiFetch } from './client'

export const USERNAME_MIN = 3
export const USERNAME_MAX = 30

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/

export const USERNAME_ERROR =
  'Username must be 3-30 characters using letters, numbers and underscores'

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value)
}

export function updateUsername(username: string): Promise<User> {
  return apiFetch<User>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  })
}
