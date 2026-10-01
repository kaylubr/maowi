import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderApp, stubApi } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  username: 'student',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

function stubSettings() {
  return stubApi([{ path: '/api/users/me', body: USER }])
}

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.clear()
  delete document.documentElement.dataset.bsTheme
})

describe('settings page', () => {
  it('groups the settings into named sections', async () => {
    stubSettings()
    renderApp('/settings')

    expect(
      await screen.findByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })

  it('defaults the theme choice to System', async () => {
    stubSettings()
    renderApp('/settings')

    expect(await screen.findByRole('radio', { name: 'System' })).toBeChecked()
  })

  it('applies an explicit dark theme and stores the override', async () => {
    const user = userEvent.setup()
    stubSettings()
    renderApp('/settings')

    await user.click(await screen.findByText('Dark'))

    expect(document.documentElement.dataset.bsTheme).toBe('dark')
    expect(window.localStorage.getItem('maowi-theme')).toBe('dark')
  })

  it('clears the stored override when returning to System', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('maowi-theme', 'dark')
    stubSettings()
    renderApp('/settings')

    await user.click(await screen.findByText('System'))

    expect(window.localStorage.getItem('maowi-theme')).toBeNull()
    expect(document.documentElement.dataset.bsTheme).toBe('light')
  })

  it('links the account section to the profile', async () => {
    stubSettings()
    renderApp('/settings')

    expect(
      await screen.findByRole('link', { name: 'Go to profile' }),
    ).toHaveAttribute('href', '/profile')
  })
})
