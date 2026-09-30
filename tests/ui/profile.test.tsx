import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dashboardStub, renderApp, stubApi } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  username: 'student',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const UPDATED = { ...USER, username: 'scholar' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('profile page', () => {
  it('shows the avatar, identity and stats', async () => {
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])

    renderApp('/profile')

    expect(
      await screen.findByRole('heading', { name: 'student' }),
    ).toBeInTheDocument()
    expect(screen.getByText(USER.email)).toBeInTheDocument()
    expect(screen.getByText(/Joined January 1, 2026/)).toBeInTheDocument()

    const avatars = screen.getAllByRole('img', { name: 'student' })
    expect(avatars.length).toBeGreaterThan(0)
    expect(avatars[0]).toHaveClass('rounded-circle')

    expect(screen.getByText('Modules').parentElement).toHaveTextContent('0')
  })

  it('updates the username through the inline editor', async () => {
    const user = userEvent.setup()
    const api = stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/profile')

    await user.click(
      await screen.findByRole('button', { name: 'Edit username' }),
    )
    const input = screen.getByLabelText('Username')
    await user.clear(input)
    await user.type(input, 'scholar')

    api.replace([
      { path: '/api/users/me', body: UPDATED },
      dashboardStub(),
      { method: 'PATCH', path: '/api/users/me', body: UPDATED },
    ])
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByRole('heading', { name: 'scholar' }),
    ).toBeInTheDocument()
    expect(api.calls).toContain('PATCH /api/users/me')
  })

  it('surfaces a username that is already taken', async () => {
    const user = userEvent.setup()
    stubApi([
      { path: '/api/users/me', body: USER },
      dashboardStub(),
      {
        method: 'PATCH',
        path: '/api/users/me',
        status: 409,
        body: { detail: 'Username already taken' },
      },
    ])
    renderApp('/profile')

    await user.click(
      await screen.findByRole('button', { name: 'Edit username' }),
    )
    const input = screen.getByLabelText('Username')
    await user.clear(input)
    await user.type(input, 'scholar')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Username already taken')).toBeInTheDocument()
  })
})
