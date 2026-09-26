import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiFetch } from '../../src/ui/src/api/client'
import { config } from '../../src/ui/src/config'

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('prefixes the configured base url and always sends credentials', async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: true }))

    await apiFetch('/api/users/me')

    expect(config.apiBaseUrl).toBe('http://localhost:8000')
    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/users/me`,
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('returns the parsed json body', async () => {
    mockFetch(jsonResponse({ id: 7, email: 'student@example.com' }))

    const body = await apiFetch<{ id: number; email: string }>('/api/users/me')

    expect(body).toEqual({ id: 7, email: 'student@example.com' })
  })

  it('sends a json content type when a body is present', async () => {
    const fetchMock = mockFetch(jsonResponse({ id: 1 }))

    await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.c', password: 'secret-pass' }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('leaves content type alone for FormData uploads', async () => {
    const fetchMock = mockFetch(jsonResponse([]))
    const form = new FormData()
    form.append('uploads', new Blob(['x']), 'notes.docx')

    await apiFetch('/api/files', { method: 'POST', body: form })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers).toBeUndefined()
  })

  it('throws an ApiError carrying the parsed error body', async () => {
    mockFetch(jsonResponse({ detail: 'At most 5 files per upload' }, 400))

    const error = await apiFetch('/api/files', { method: 'POST' }).catch(
      (thrown: unknown) => thrown,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).body).toEqual({
      detail: 'At most 5 files per upload',
    })
  })

  it('surfaces the backend detail as the error message', async () => {
    mockFetch(jsonResponse({ detail: 'Invalid email or password' }, 401))

    const error = await apiFetch('/api/auth/login').catch(
      (thrown: unknown) => thrown as ApiError,
    )

    expect(error.message).toBe('Invalid email or password')
  })

  it('reports the 401 status so callers can detect an unauthenticated session', async () => {
    mockFetch(jsonResponse({ detail: 'Not authenticated' }, 401))

    const error = await apiFetch('/api/users/me').catch(
      (thrown: unknown) => thrown as ApiError,
    )

    expect(error.status).toBe(401)
  })

  it('returns null for a 204 no content response', async () => {
    mockFetch(new Response(null, { status: 204 }))

    await expect(apiFetch('/api/auth/logout', { method: 'POST' })).resolves.toBeNull()
  })
})
