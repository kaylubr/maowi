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

function stubAccount() {
  return stubApi([{ path: '/api/users/me', body: USER }, dashboardStub()])
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('profile menu', () => {
  it('opens the dropdown from the avatar button', async () => {
    const user = userEvent.setup()
    stubAccount()
    renderApp('/dashboard')

    const trigger = await screen.findByRole('button', { name: 'Account menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/profile',
    )
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
    expect(
      screen.getByRole('button', { name: 'Logout' }),
    ).toBeInTheDocument()
  })

  it('shows the avatar inside the button', async () => {
    stubAccount()
    renderApp('/dashboard')

    const trigger = await screen.findByRole('button', { name: 'Account menu' })
    expect(within(trigger).getByRole('img')).toHaveClass('rounded-circle')
  })

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup()
    stubAccount()
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Account menu' }))
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument()
  })

  it('closes when the pointer presses outside', async () => {
    const user = userEvent.setup()
    stubAccount()
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Account menu' }))
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()

    await user.click(document.body)

    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument()
  })

  it('navigates to the settings page', async () => {
    const user = userEvent.setup()
    stubAccount()
    const { router } = renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Account menu' }))
    await user.click(screen.getByRole('link', { name: 'Settings' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/settings'))
  })

  it('confirms before logging out', async () => {
    const user = userEvent.setup()
    const api = stubAccount()
    const { router } = renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Account menu' }))
    await user.click(screen.getByRole('button', { name: 'Logout' }))

    const dialog = await screen.findByRole('dialog', { name: 'Log out' })

    api.replace([
      {
        path: '/api/users/me',
        status: 401,
        body: { detail: 'Not authenticated' },
      },
      { method: 'POST', path: '/api/auth/logout', status: 204 },
    ])
    await user.click(within(dialog).getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(api.calls).toContain('POST /api/auth/logout')
  })
})
