import { screen, waitFor, within } from '@testing-library/react'
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

const UNAUTHENTICATED = {
  path: '/api/users/me',
  status: 401,
  body: { detail: 'Not authenticated' },
}

const DASHBOARD_STUBS = [dashboardStub()]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('protected routes', () => {
  it('redirects to the login page when the session is not authenticated', async () => {
    stubApi([UNAUTHENTICATED])

    const { router } = renderApp('/dashboard')

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('renders protected content and the navbar for a valid session', async () => {
    stubApi([{ path: '/api/users/me', body: USER }, ...DASHBOARD_STUBS])

    renderApp('/dashboard')

    expect(await screen.findByText('Your modules')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Account menu' }),
    ).toBeInTheDocument()
  })

  it('surfaces a server error instead of redirecting', async () => {
    stubApi([
      { path: '/api/users/me', status: 500, body: { detail: 'Database is down' } },
    ])

    const { router } = renderApp('/dashboard')

    expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dashboard')
  })
})

describe('login', () => {
  it('logs in and lands on the dashboard', async () => {
    const user = userEvent.setup()
    const api = stubApi([UNAUTHENTICATED])
    const { router } = renderApp('/login')

    await user.type(await screen.findByLabelText('Email'), USER.email)
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery')

    api.replace([
      { path: '/api/users/me', body: USER },
      ...DASHBOARD_STUBS,
      { method: 'POST', path: '/api/auth/login', body: USER },
    ])
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    expect(api.calls).toContain('POST /api/auth/login')
  })

  it('shows the backend error message when credentials are rejected', async () => {
    const user = userEvent.setup()
    stubApi([
      UNAUTHENTICATED,
      {
        method: 'POST',
        path: '/api/auth/login',
        status: 401,
        body: { detail: 'Invalid email or password' },
      },
    ])
    const { router } = renderApp('/login')

    await user.type(await screen.findByLabelText('Email'), USER.email)
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
    expect(router.state.location.pathname).toBe('/login')
  })
})

describe('register', () => {
  it('creates the account then establishes a session', async () => {
    const user = userEvent.setup()
    const api = stubApi([UNAUTHENTICATED])
    const { router } = renderApp('/register')

    await user.type(await screen.findByLabelText('Email'), USER.email)
    await user.type(screen.getByLabelText('Username'), 'student')
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery')

    api.replace([
      { path: '/api/users/me', body: USER },
      ...DASHBOARD_STUBS,
      { method: 'POST', path: '/api/auth/register', status: 201, body: USER },
      { method: 'POST', path: '/api/auth/login', body: USER },
    ])
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    expect(api.calls).toContain('POST /api/auth/register')
    expect(api.calls).toContain('POST /api/auth/login')
  })
})

describe('logout', () => {
  it('asks for confirmation before ending the session', async () => {
    const user = userEvent.setup()
    const api = stubApi([
      { path: '/api/users/me', body: USER },
      ...DASHBOARD_STUBS,
    ])
    const { router } = renderApp('/dashboard')

    await screen.findByText('Your modules')
    await user.click(screen.getByRole('button', { name: 'Account menu' }))
    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(await screen.findByRole('dialog', { name: 'Log out' })).toBeInTheDocument()

    api.replace([
      { path: '/api/users/me', status: 401, body: { detail: 'Not authenticated' } },
      { method: 'POST', path: '/api/auth/logout', status: 204 },
    ])
    const dialog = screen.getByRole('dialog', { name: 'Log out' })
    await user.click(within(dialog).getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(api.calls).toContain('POST /api/auth/logout')
  })

  it('keeps the session when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const api = stubApi([
      { path: '/api/users/me', body: USER },
      ...DASHBOARD_STUBS,
    ])
    renderApp('/dashboard')

    await screen.findByText('Your modules')
    await user.click(screen.getByRole('button', { name: 'Account menu' }))
    await user.click(screen.getByRole('button', { name: 'Logout' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(api.calls).not.toContain('POST /api/auth/logout')
  })
})

describe('back to the landing page', () => {
  it('returns to the landing page from login', async () => {
    const user = userEvent.setup()
    stubApi([UNAUTHENTICATED])
    const { router } = renderApp('/login')

    await user.click(await screen.findByRole('link', { name: 'Back' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('returns to the landing page from register', async () => {
    const user = userEvent.setup()
    stubApi([UNAUTHENTICATED])
    const { router } = renderApp('/register')

    await user.click(await screen.findByRole('link', { name: 'Back' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})
