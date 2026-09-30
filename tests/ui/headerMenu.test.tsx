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

describe('header menu on wide viewports', () => {
  it('keeps the navbar controls inline with no menu button', async () => {
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    expect(await screen.findByText(USER.username)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
  })

  it('keeps the landing links inline with no menu button', () => {
    stubApi([])
    renderApp('/')

    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
  })
})

describe('header menu on compact viewports', () => {
  it('collapses the navbar controls behind the menu button', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    const menuButton = await screen.findByRole('button', { name: 'Menu' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(USER.email)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()

    await user.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(USER.username)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()

    await user.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('closes the menu when Escape is pressed', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('closes the menu when the pointer presses outside', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('shows the landing links in the menu and navigates from them', async () => {
    const user = userEvent.setup()
    stubViewport(true)
    const api = stubApi([])
    const { router } = renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Menu' }))

    const logIn = screen.getByRole('link', { name: 'Log in' })
    expect(logIn).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument()

    api.replace([UNAUTHENTICATED])
    await user.click(logIn)

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
