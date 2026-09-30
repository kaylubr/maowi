import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dashboardStub, renderApp, stubApi, stubViewport } from './helpers'

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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('app navbar', () => {
  it('shows the dashboard link and account menu, with no hamburger or standalone log out', async () => {
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Account menu' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Log out' }),
    ).not.toBeInTheDocument()
  })

  it('keeps the account menu on compact viewports', async () => {
    stubViewport(true)
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Account menu' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
  })
})

describe('landing header menu', () => {
  it('keeps the landing links inline with no menu button', () => {
    stubApi([])
    renderApp('/')

    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
  })

  it('collapses the landing links behind the menu button', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    stubApi([])
    renderApp('/')

    const menuButton = screen.getByRole('button', { name: 'Menu' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('link', { name: 'Get started' }),
    ).not.toBeInTheDocument()

    await user.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument()
  })

  it('closes the landing menu when Escape is pressed', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    stubApi([])
    renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('link', { name: 'Get started' }),
    ).not.toBeInTheDocument()
  })

  it('closes the landing menu when the pointer presses outside', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    stubApi([])
    renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument()

    await user.click(document.body)

    expect(
      screen.queryByRole('link', { name: 'Get started' }),
    ).not.toBeInTheDocument()
  })

  it('navigates from the landing menu links', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    const api = stubApi([])
    const { router } = renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Menu' }))

    const logIn = screen.getByRole('link', { name: 'Log in' })

    api.replace([UNAUTHENTICATED])
    await user.click(logIn)

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
