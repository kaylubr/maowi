import { screen } from '@testing-library/react'
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
})
