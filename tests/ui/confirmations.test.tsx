import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ModuleSummary } from '../../src/ui/src/api/dashboard'
import { dashboardStub, moduleSummary, renderApp, stubApi } from './helpers'
import type { StubResponse } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

const CELL_BIOLOGY = moduleSummary({ id: 10, name: 'Cell Biology' })
const PHOTOSYNTHESIS = moduleSummary({ id: 11, name: 'Photosynthesis' })

function stubDashboard(modules: ModuleSummary[] = [], extra: StubResponse[] = []) {
  return stubApi([
    { path: '/api/users/me', body: USER },
    dashboardStub(modules),
    ...extra,
  ])
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('deleting a module', () => {
  it('offers a delete button per module', async () => {
    stubDashboard([CELL_BIOLOGY, PHOTOSYNTHESIS])

    renderApp('/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Delete Cell Biology' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Delete Photosynthesis' }),
    ).toBeInTheDocument()
  })

  it('deletes only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([CELL_BIOLOGY], [
      { method: 'DELETE', path: `/api/modules/${CELL_BIOLOGY.id}`, status: 204 },
    ])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Delete Cell Biology' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Delete module' })
    expect(dialog).toHaveTextContent(/cannot be undone/i)
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(api.calls).toContain(`DELETE /api/modules/${CELL_BIOLOGY.id}`),
    )
  })

  it('keeps the module when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([CELL_BIOLOGY])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Delete Cell Biology' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Delete module' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(api.calls).not.toContain(`DELETE /api/modules/${CELL_BIOLOGY.id}`)
  })

  it('reports a failed deletion instead of silently closing', async () => {
    const user = userEvent.setup()
    stubDashboard([CELL_BIOLOGY], [
      {
        method: 'DELETE',
        path: `/api/modules/${CELL_BIOLOGY.id}`,
        status: 500,
        body: { detail: 'Database is down' },
      },
    ])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Delete Cell Biology' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Delete module' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Database is down',
    )
  })
})
