import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dashboardStub, renderApp, stubApi } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  username: null,
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const UPDATED = { ...USER, username: 'scholar' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('choosing a username', () => {
  it('blocks the dashboard until a username is chosen', async () => {
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])

    renderApp('/dashboard')

    expect(await screen.findByText('Choose your username')).toBeInTheDocument()
    expect(screen.queryByText('Your modules')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('rejects an invalid username without calling the api', async () => {
    const user = userEvent.setup()
    const api = stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    await user.type(await screen.findByLabelText('Username'), 'no spaces!')

    expect(await screen.findByText(/3-30 characters/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(api.calls).not.toContain('PATCH /api/users/me')
  })

  it('saves the username and reveals the dashboard', async () => {
    const user = userEvent.setup()
    const api = stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    await user.type(await screen.findByLabelText('Username'), 'scholar')

    api.replace([
      { path: '/api/users/me', body: UPDATED },
      dashboardStub(),
      { method: 'PATCH', path: '/api/users/me', body: UPDATED },
    ])
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Your modules')).toBeInTheDocument()
    expect(api.calls).toContain('PATCH /api/users/me')

    const request = api.requests.find((entry) => entry.method === 'PATCH')
    expect(JSON.parse(String(request?.body))).toEqual({ username: 'scholar' })
  })
})
