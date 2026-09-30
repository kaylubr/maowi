import { screen, waitFor } from '@testing-library/react'
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

function stubGoogle(credential = 'google-credential') {
  let credentialHandler:
    | ((response: { credential: string }) => void)
    | undefined

  const initialize = vi.fn(
    (options: { callback: (response: { credential: string }) => void }) => {
      credentialHandler = options.callback
    },
  )

  const renderButton = vi.fn((element: HTMLElement) => {
    const button = document.createElement('button')
    button.textContent = 'Sign in with Google'
    button.addEventListener('click', () =>
      credentialHandler?.({ credential }),
    )
    element.appendChild(button)
  })

  vi.stubGlobal('google', {
    accounts: { id: { initialize, renderButton } },
  })

  return { initialize, renderButton }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('google sign-in', () => {
  it('signs in with Google and lands on the dashboard', async () => {
    const user = userEvent.setup()
    stubGoogle()
    const api = stubApi([UNAUTHENTICATED])
    const { router } = renderApp('/login')

    const button = await screen.findByRole('button', {
      name: 'Sign in with Google',
    })

    api.replace([
      { path: '/api/users/me', body: USER },
      dashboardStub(),
      { method: 'POST', path: '/api/auth/google', body: USER },
    ])
    await user.click(button)

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    expect(api.calls).toContain('POST /api/auth/google')
    const request = api.requests.find((entry) => entry.path === '/api/auth/google')
    expect(request?.body).toContain('google-credential')
  })

  it('offers Google sign-in on the register page', async () => {
    stubGoogle()
    stubApi([UNAUTHENTICATED])

    renderApp('/register')

    expect(
      await screen.findByRole('button', { name: 'Sign in with Google' }),
    ).toBeInTheDocument()
  })

  it('shows the backend error when Google sign-in is rejected', async () => {
    const user = userEvent.setup()
    stubGoogle()
    stubApi([
      UNAUTHENTICATED,
      {
        method: 'POST',
        path: '/api/auth/google',
        status: 403,
        body: { detail: 'Google email not verified' },
      },
    ])
    const { router } = renderApp('/login')

    await user.click(
      await screen.findByRole('button', { name: 'Sign in with Google' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Google email not verified',
    )
    expect(router.state.location.pathname).toBe('/login')
  })
})
