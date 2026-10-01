import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dashboardStub, renderApp, stubApi } from './helpers'
import type { StubResponse } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  username: 'student',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const UNAUTHENTICATED = {
  path: '/api/users/me',
  status: 401,
  body: { detail: 'Not authenticated' },
}

const TOKEN = 'abc123'
const MODULE_ID = 7

const INVITATION = { module_name: 'Cell Biology', owner_username: 'alice' }

function moduleStubs(): StubResponse[] {
  return [
    {
      path: `/api/modules/${MODULE_ID}`,
      body: {
        id: MODULE_ID,
        name: 'Cell Biology',
        is_owner: false,
        invite_token: TOKEN,
        member_count: 1,
      },
    },
    { path: `/api/modules/${MODULE_ID}/leaderboard`, body: [] },
    { path: `/api/modules/${MODULE_ID}/members`, body: [] },
    dashboardStub([]),
  ]
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('invitation link', () => {
  it('sends an unauthenticated visitor through login and back to the invite', async () => {
    const user = userEvent.setup()
    const api = stubApi([
      UNAUTHENTICATED,
      { path: `/api/invitations/${TOKEN}`, body: INVITATION },
    ])
    const { router } = renderApp(`/invite/${TOKEN}`)

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))

    await user.type(await screen.findByLabelText('Email'), USER.email)
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery')

    api.replace([
      { path: '/api/users/me', body: USER },
      { path: `/api/invitations/${TOKEN}`, body: INVITATION },
      {
        method: 'POST',
        path: `/api/invitations/${TOKEN}/accept`,
        status: 201,
        body: { module_id: MODULE_ID },
      },
      { method: 'POST', path: '/api/auth/login', body: USER },
      ...moduleStubs(),
    ])

    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/invite/${TOKEN}`),
    )

    await user.click(
      await screen.findByRole('button', { name: 'Accept invitation' }),
    )

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/modules/${MODULE_ID}`),
    )
  })

  it('shows the module and owner to an authenticated visitor and joins', async () => {
    const user = userEvent.setup()
    stubApi([
      { path: '/api/users/me', body: USER },
      { path: `/api/invitations/${TOKEN}`, body: INVITATION },
      {
        method: 'POST',
        path: `/api/invitations/${TOKEN}/accept`,
        status: 201,
        body: { module_id: MODULE_ID },
      },
      ...moduleStubs(),
    ])
    const { router } = renderApp(`/invite/${TOKEN}`)

    expect(await screen.findByText('Join Cell Biology')).toBeInTheDocument()
    expect(screen.getByText('Invited by alice')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Accept invitation' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/modules/${MODULE_ID}`),
    )
  })

  it('shows a friendly message when the invitation is dead', async () => {
    stubApi([
      UNAUTHENTICATED,
      {
        path: `/api/invitations/${TOKEN}`,
        status: 404,
        body: { detail: 'Invitation not found' },
      },
    ])

    renderApp(`/invite/${TOKEN}`)

    expect(await screen.findByText(/no longer valid/i)).toBeInTheDocument()
  })
})
