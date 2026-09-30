import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dashboardStub, renderApp, stubApi } from './helpers'
import type { StubResponse } from './helpers'

const OWNER = {
  id: 1,
  email: 'alice@example.com',
  username: 'alice',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const MEMBER = {
  id: 2,
  email: 'bob@example.com',
  username: 'bob',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const MODULE_ID = 10
const TOKEN = 'tok-123'

const LEADERBOARD = [
  {
    user_id: 1,
    username: 'alice',
    avatar_url: null,
    is_owner: true,
    best_score: 80,
    best_mcq_score: 75,
    best_identification_score: 90,
    attempt_count: 4,
    last_studied_at: '2026-01-01T00:00:00Z',
  },
  {
    user_id: 2,
    username: 'bob',
    avatar_url: null,
    is_owner: false,
    best_score: 50,
    best_mcq_score: 50,
    best_identification_score: null,
    attempt_count: 2,
    last_studied_at: '2026-01-01T01:00:00Z',
  },
  {
    user_id: 3,
    username: 'carol',
    avatar_url: null,
    is_owner: false,
    best_score: null,
    best_mcq_score: null,
    best_identification_score: null,
    attempt_count: 0,
    last_studied_at: null,
  },
]

const MEMBERS = [
  { user_id: 1, username: 'alice', avatar_url: null, is_owner: true, joined_at: null },
  {
    user_id: 2,
    username: 'bob',
    avatar_url: null,
    is_owner: false,
    joined_at: '2026-01-02T00:00:00Z',
  },
]

function moduleDetail(isOwner: boolean) {
  return {
    id: MODULE_ID,
    name: 'Cell Biology',
    is_owner: isOwner,
    invite_token: TOKEN,
    member_count: MEMBERS.length - 1,
  }
}

type StubPageOptions = {
  isOwner: boolean
  currentUser: typeof OWNER
  extra?: StubResponse[]
}

function stubModulePage({
  isOwner,
  currentUser,
  extra = [],
}: StubPageOptions) {
  return stubApi([
    { path: '/api/users/me', body: currentUser },
    { path: `/api/modules/${MODULE_ID}`, body: moduleDetail(isOwner) },
    { path: `/api/modules/${MODULE_ID}/leaderboard`, body: LEADERBOARD },
    { path: `/api/modules/${MODULE_ID}/members`, body: MEMBERS },
    dashboardStub([]),
    ...extra,
  ])
}

function inviteLink(token = TOKEN) {
  return `${window.location.origin}/invite/${token}`
}

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('module leaderboard', () => {
  it('ranks members and shows their best scores', async () => {
    stubModulePage({ isOwner: true, currentUser: OWNER })

    renderApp(`/modules/${MODULE_ID}`)

    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row')

    expect(within(rows[1]).getByText('alice')).toBeInTheDocument()
    expect(within(rows[1]).getAllByRole('cell')[0]).toHaveTextContent('1')
    expect(within(rows[1]).getByText('Owner')).toBeInTheDocument()
    expect(within(rows[2]).getByText('bob')).toBeInTheDocument()
    expect(within(rows[2]).getAllByRole('cell')[0]).toHaveTextContent('2')
    expect(within(rows[3]).getByText('carol')).toBeInTheDocument()
    expect(within(rows[3]).getAllByRole('cell')[0]).toHaveTextContent('3')

    expect(within(rows[1]).getAllByRole('cell')[2]).toHaveTextContent('80%')
    expect(within(rows[2]).getAllByRole('cell')[2]).toHaveTextContent('50%')

    const bars = within(table).getAllByRole('progressbar')
    expect(bars).toHaveLength(2)
    expect(bars[0]).toHaveAttribute('aria-valuenow', '80')

    expect(within(rows[3]).getAllByText('—').length).toBeGreaterThan(0)
    expect(within(rows[3]).getByText('Not yet')).toBeInTheDocument()
  })
})

describe('invitation controls', () => {
  it('offers a copy link that writes to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    stubModulePage({ isOwner: true, currentUser: OWNER })

    renderApp(`/modules/${MODULE_ID}`)

    expect(await screen.findByDisplayValue(inviteLink())).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(inviteLink()))
    expect(
      await screen.findByRole('button', { name: 'Copied!' }),
    ).toBeInTheDocument()
  })

  it('hides regenerate from members', async () => {
    stubModulePage({ isOwner: false, currentUser: MEMBER })

    renderApp(`/modules/${MODULE_ID}`)

    await screen.findByDisplayValue(inviteLink())

    expect(
      screen.queryByRole('button', { name: 'Regenerate link' }),
    ).not.toBeInTheDocument()
  })

  it('regenerates the link for the owner', async () => {
    const user = userEvent.setup()
    const api = stubModulePage({
      isOwner: true,
      currentUser: OWNER,
      extra: [
        {
          method: 'POST',
          path: `/api/modules/${MODULE_ID}/invitation/regenerate`,
          body: { invite_token: 'fresh-token' },
        },
      ],
    })

    renderApp(`/modules/${MODULE_ID}`)

    await screen.findByDisplayValue(inviteLink())

    await user.click(screen.getByRole('button', { name: 'Regenerate link' }))
    const dialog = await screen.findByRole('dialog', { name: 'Regenerate link' })
    await user.click(within(dialog).getByRole('button', { name: 'Regenerate' }))

    await waitFor(() =>
      expect(api.calls).toContain(
        `POST /api/modules/${MODULE_ID}/invitation/regenerate`,
      ),
    )
    expect(
      await screen.findByDisplayValue(inviteLink('fresh-token')),
    ).toBeInTheDocument()
  })
})

describe('membership', () => {
  it('lets the owner remove a member', async () => {
    const user = userEvent.setup()
    const api = stubModulePage({
      isOwner: true,
      currentUser: OWNER,
      extra: [
        {
          method: 'DELETE',
          path: `/api/modules/${MODULE_ID}/members/2`,
          status: 204,
        },
      ],
    })

    renderApp(`/modules/${MODULE_ID}`)

    await screen.findByRole('heading', { name: 'Cell Biology' })
    expect(
      screen.queryByRole('button', { name: 'Remove alice' }),
    ).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Remove bob' }))
    const dialog = await screen.findByRole('dialog', { name: 'Remove member' })
    expect(dialog).toHaveTextContent(/Remove bob from this module/i)
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    await waitFor(() =>
      expect(api.calls).toContain(
        `DELETE /api/modules/${MODULE_ID}/members/2`,
      ),
    )
  })

  it('lets a member leave the module', async () => {
    const user = userEvent.setup()
    const api = stubModulePage({
      isOwner: false,
      currentUser: MEMBER,
      extra: [
        {
          method: 'DELETE',
          path: `/api/modules/${MODULE_ID}/members/me`,
          status: 204,
        },
      ],
    })
    const { router } = renderApp(`/modules/${MODULE_ID}`)

    await screen.findByRole('heading', { name: 'Cell Biology' })

    await user.click(screen.getByRole('button', { name: 'Leave module' }))
    const dialog = await screen.findByRole('dialog', { name: 'Leave module' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Leave module' }),
    )

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    expect(api.calls).toContain(`DELETE /api/modules/${MODULE_ID}/members/me`)
  })
})

describe('missing module', () => {
  it('shows the not-found state when the module is gone', async () => {
    stubApi([
      { path: '/api/users/me', body: OWNER },
      {
        path: `/api/modules/${MODULE_ID}`,
        status: 404,
        body: { detail: 'Module not found' },
      },
      dashboardStub([]),
    ])

    renderApp(`/modules/${MODULE_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Module not found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })
})
