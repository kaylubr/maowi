import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderApp, stubApi } from './helpers'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('landing page', () => {
  it('renders the marketing copy without calling the api', async () => {
    const api = stubApi([])

    renderApp('/')

    expect(
      screen.getByRole('heading', { name: /turn your lecture notes/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Flashcard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Multiple Choice' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Identification' }),
    ).toBeInTheDocument()
    expect(api.calls).toEqual([])
  })

  it('links to the login and register pages', () => {
    stubApi([])

    renderApp('/')

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute(
      'href',
      '/register',
    )
    expect(
      screen.getByRole('link', { name: /create a free account/i }),
    ).toHaveAttribute('href', '/register')
  })

  it('swaps the sample question when another study mode is selected', async () => {
    const api = stubApi([])
    const user = userEvent.setup()

    renderApp('/')

    expect(
      screen.getByRole('tab', { name: 'Flashcard' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Ribosome')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Multiple Choice' }))

    expect(
      screen.getByRole('tab', { name: 'Multiple Choice' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Ribosome')).toBeInTheDocument()
    expect(api.calls).toEqual([])
  })

  it('points the footer at the legal pages, contact, and the source', () => {
    stubApi([])

    renderApp('/')

    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(screen.getByRole('link', { name: 'Terms of service' })).toHaveAttribute(
      'href',
      '/terms',
    )
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/contact',
    )
    expect(screen.getByRole('link', { name: 'Source code' })).toHaveAttribute(
      'href',
      'https://github.com/kaylubr/maowi',
    )
    expect(screen.queryByText('On this page')).not.toBeInTheDocument()
    expect(screen.queryByText('Your account')).not.toBeInTheDocument()
  })
})
