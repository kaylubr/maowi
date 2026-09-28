import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderApp, stubApi } from './helpers'

const CONTACT_EMAIL = 'kbreyes.dev@gmail.com'
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('privacy policy', () => {
  it('renders the policy with the contact email and no api calls', () => {
    const api = stubApi([])

    renderApp('/privacy')

    expect(
      screen.getByRole('heading', { name: 'Privacy policy' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
      'href',
      CONTACT_HREF,
    )
    expect(api.calls).toEqual([])
  })
})

describe('terms of service', () => {
  it('renders the terms with the contact email', () => {
    stubApi([])

    renderApp('/terms')

    expect(
      screen.getByRole('heading', { name: 'Terms of service' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
      'href',
      CONTACT_HREF,
    )
  })
})

describe('contact', () => {
  it('offers the contact email', () => {
    stubApi([])

    renderApp('/contact')

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
      'href',
      CONTACT_HREF,
    )
  })
})

describe('register agreement', () => {
  it('links the terms and privacy policy from the register page', async () => {
    stubApi([
      { path: '/api/users/me', status: 401, body: { detail: 'Not authenticated' } },
    ])

    renderApp('/register')

    expect(
      await screen.findByRole('link', { name: 'Terms of service' }),
    ).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })
})
