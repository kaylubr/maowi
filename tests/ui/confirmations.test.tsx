import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { UploadedFile } from '../../src/ui/src/api/files'
import type { StudyModule } from '../../src/ui/src/api/modules'
import { renderApp, stubApi } from './helpers'
import type { StubResponse } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

const DRAFT_MODULE: StudyModule = {
  id: 10,
  name: 'Cell Biology',
  status: 'draft',
  error_message: null,
}

const READY_MODULE: StudyModule = {
  id: 11,
  name: 'Photosynthesis',
  status: 'ready',
  error_message: null,
}

const FILE: UploadedFile = {
  id: 100,
  filename: 'lecture.pdf',
  file_type: 'pdf',
  status: 'parsed',
  error_message: null,
  module_id: null,
}

function stubDashboard(
  modules: StudyModule[],
  files: UploadedFile[],
  extra: StubResponse[] = [],
) {
  return stubApi([
    { path: '/api/users/me', body: USER },
    { path: '/api/modules', body: modules },
    { path: '/api/files', body: files },
    ...extra,
  ])
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generating questions', () => {
  it('only offers Generate on draft modules', async () => {
    stubDashboard([DRAFT_MODULE, READY_MODULE], [])

    renderApp('/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Generate questions for Cell Biology' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Generate questions for Photosynthesis',
      }),
    ).not.toBeInTheDocument()
  })

  it('offers Retry instead of Generate on a failed module', async () => {
    stubDashboard(
      [{ ...DRAFT_MODULE, status: 'failed', error_message: 'Gemini exploded' }],
      [],
    )

    renderApp('/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Retry questions for Cell Biology' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Generate questions for Cell Biology' }),
    ).not.toBeInTheDocument()
  })

  it('warns about AI quota before generating', async () => {
    const user = userEvent.setup()
    stubDashboard([DRAFT_MODULE], [])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', {
        name: 'Generate questions for Cell Biology',
      }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'Generate questions' })
    expect(dialog).toHaveTextContent(/consumes your ai quota/i)
  })

  it('generates only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([DRAFT_MODULE], [], [
      { method: 'POST', path: `/api/modules/${DRAFT_MODULE.id}/generate`, status: 202, body: DRAFT_MODULE },
    ])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', {
        name: 'Generate questions for Cell Biology',
      }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Generate questions' })
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }))

    await waitFor(() =>
      expect(api.calls).toContain(`POST /api/modules/${DRAFT_MODULE.id}/generate`),
    )
  })

  it('does not generate when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([DRAFT_MODULE], [])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', {
        name: 'Generate questions for Cell Biology',
      }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Generate questions' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(api.calls).not.toContain(`POST /api/modules/${DRAFT_MODULE.id}/generate`)
  })
})

describe('deleting a file', () => {
  it('deletes only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([], [FILE], [
      { method: 'DELETE', path: `/api/files/${FILE.id}`, status: 204 },
    ])

    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Delete lecture.pdf' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete file' })
    expect(dialog).toHaveTextContent(/cannot be undone/i)
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(api.calls).toContain(`DELETE /api/files/${FILE.id}`),
    )
  })

  it('keeps the file when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([], [FILE])

    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Delete lecture.pdf' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete file' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(api.calls).not.toContain(`DELETE /api/files/${FILE.id}`)
  })
})

describe('deleting a module', () => {
  it('deletes only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([DRAFT_MODULE], [], [
      { method: 'DELETE', path: `/api/modules/${DRAFT_MODULE.id}`, status: 204 },
    ])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Delete Cell Biology' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Delete module' })
    expect(dialog).toHaveTextContent(/cannot be undone/i)
    expect(dialog).toHaveTextContent(/left unassigned/i)
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(api.calls).toContain(`DELETE /api/modules/${DRAFT_MODULE.id}`),
    )
  })

  it('keeps the module when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([DRAFT_MODULE], [])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Delete Cell Biology' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Delete module' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(api.calls).not.toContain(`DELETE /api/modules/${DRAFT_MODULE.id}`)
  })
})

describe('merging modules', () => {
  it('offers every other module as a merge target but not the source', async () => {
    const user = userEvent.setup()
    stubDashboard([DRAFT_MODULE, READY_MODULE], [])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Merge Cell Biology' }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'Merge module' })
    const options = within(dialog).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'Choose a module…',
      'Photosynthesis',
    ])
  })

  it('cannot continue until a target is chosen', async () => {
    const user = userEvent.setup()
    stubDashboard([DRAFT_MODULE, READY_MODULE], [])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Merge Cell Biology' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Merge module' })

    expect(within(dialog).getByRole('button', { name: 'Continue' })).toBeDisabled()

    await user.selectOptions(
      within(dialog).getByLabelText('Merge into'),
      String(READY_MODULE.id),
    )

    expect(within(dialog).getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  it('explains what merging does and then performs it', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([DRAFT_MODULE, READY_MODULE], [], [
      {
        method: 'POST',
        path: `/api/modules/${DRAFT_MODULE.id}/merge`,
        body: READY_MODULE,
      },
    ])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Merge Cell Biology' }),
    )
    const picker = await screen.findByRole('dialog', { name: 'Merge module' })
    await user.selectOptions(
      within(picker).getByLabelText('Merge into'),
      String(READY_MODULE.id),
    )
    await user.click(within(picker).getByRole('button', { name: 'Continue' }))

    const dialog = await screen.findByRole('dialog', { name: 'Merge modules' })
    expect(dialog).toHaveTextContent(/Cell Biology/)
    expect(dialog).toHaveTextContent(/Photosynthesis/)
    await user.click(within(dialog).getByRole('button', { name: 'Merge' }))

    await waitFor(() =>
      expect(api.calls).toContain(`POST /api/modules/${DRAFT_MODULE.id}/merge`),
    )
    const mergeRequest = api.requests.find(
      (request) =>
        request.method === 'POST' &&
        request.path === `/api/modules/${DRAFT_MODULE.id}/merge`,
    )
    expect(JSON.parse(String(mergeRequest?.body))).toEqual({
      target_module_id: READY_MODULE.id,
    })
  })

  it('explains that merging needs a second module', async () => {
    const user = userEvent.setup()
    stubDashboard([DRAFT_MODULE], [])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Merge Cell Biology' }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'Merge module' })
    expect(dialog).toHaveTextContent(/at least two modules/i)
    expect(within(dialog).getByRole('button', { name: 'Continue' })).toBeDisabled()
  })
})

describe('action failures', () => {
  it('reports a failed action instead of silently closing', async () => {
    const user = userEvent.setup()
    stubDashboard([DRAFT_MODULE], [], [
      {
        method: 'POST',
        path: `/api/modules/${DRAFT_MODULE.id}/generate`,
        status: 400,
        body: { detail: 'Questions can only be generated for a draft module' },
      },
    ])

    renderApp('/dashboard')

    await user.click(
      await screen.findByRole('button', {
        name: 'Generate questions for Cell Biology',
      }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Generate questions' })
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Questions can only be generated for a draft module',
    )
  })
})
