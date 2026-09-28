import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ModuleSummary } from '../../src/ui/src/api/dashboard'
import type { ModuleCreation } from '../../src/ui/src/api/modules'
import { dashboardStub, moduleSummary, renderApp, stubApi } from './helpers'
import type { StubResponse } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

const CELL_BIOLOGY = moduleSummary(
  { id: 10, name: 'Cell Biology' },
  {
    question_count: 24,
    attempt_count: 3,
    best_score: 92,
    last_studied_at: '2026-09-27T00:00:00Z',
  },
)
const PHOTOSYNTHESIS = moduleSummary(
  { id: 11, name: 'Photosynthesis' },
  { question_count: 12 },
)

const CREATIONS_PATH = '/api/modules/creations'

function creation(id: number, body: Partial<ModuleCreation>): ModuleCreation {
  return {
    id,
    status: 'generating',
    module_id: null,
    error_message: null,
    ...body,
  }
}

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

describe('dashboard', () => {
  it('lists modules', async () => {
    stubDashboard([CELL_BIOLOGY, PHOTOSYNTHESIS])

    renderApp('/dashboard')

    expect(await screen.findByText('Cell Biology')).toBeInTheDocument()
    expect(screen.getByText('Photosynthesis')).toBeInTheDocument()
  })

  it('summarises the library in the hero', async () => {
    stubDashboard([CELL_BIOLOGY, PHOTOSYNTHESIS])

    renderApp('/dashboard')

    expect(await screen.findByText('Modules')).toBeInTheDocument()
    expect(screen.getByText('Modules').parentElement).toHaveTextContent('2')
    expect(screen.getByText('Questions').parentElement).toHaveTextContent('36')
    expect(screen.getByText('Attempts').parentElement).toHaveTextContent('3')
    expect(screen.getByText('Average score').parentElement).toHaveTextContent('—')
  })

  it('shows question counts and study history on each card', async () => {
    stubDashboard([CELL_BIOLOGY, PHOTOSYNTHESIS])

    renderApp('/dashboard')

    expect(await screen.findByText('24 questions')).toBeInTheDocument()
    expect(screen.getByText('12 questions')).toBeInTheDocument()
    expect(screen.getByText(/best 92%/i)).toBeInTheDocument()
    expect(screen.getByText('Not studied yet')).toBeInTheDocument()
  })

  it('shows an empty state when there are no modules', async () => {
    stubDashboard([])

    renderApp('/dashboard')

    expect(await screen.findByText(/no modules yet/i)).toBeInTheDocument()
  })

  it('offers study and delete on every module', async () => {
    stubDashboard([CELL_BIOLOGY])

    renderApp('/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Study Cell Biology' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Delete Cell Biology' }),
    ).toBeInTheDocument()
  })
})

describe('adding a module', () => {
  it('rejects a selection larger than the cap before calling the api', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Add module' }))
    const tooMany = Array.from(
      { length: 6 },
      (_, index) => new File(['x'], `notes-${index}.pdf`),
    )
    await user.upload(screen.getByLabelText('Files'), tooMany)

    expect(await screen.findByRole('alert')).toHaveTextContent(/at most 5/i)
    expect(api.calls).not.toContain(`POST ${CREATIONS_PATH}`)
  })

  it('posts the name and files as multipart form data', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([], [
      {
        method: 'POST',
        path: CREATIONS_PATH,
        status: 202,
        body: creation(1, {}),
      },
      {
        path: `${CREATIONS_PATH}/1`,
        body: creation(1, { status: 'ready', module_id: 12 }),
      },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Add module' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add module' })
    await user.type(within(dialog).getByLabelText('Module name'), 'Cell Biology')
    await user.upload(within(dialog).getByLabelText('Files'), [
      new File(['a'], 'lecture.pdf'),
      new File(['b'], 'notes.docx'),
    ])
    await user.click(
      within(dialog).getByRole('button', { name: 'Create module' }),
    )

    await waitFor(() => expect(api.calls).toContain(`POST ${CREATIONS_PATH}`))

    const post = api.requests.find(
      (request) => request.method === 'POST' && request.path === CREATIONS_PATH,
    )
    const form = post?.body as FormData
    expect(form).toBeInstanceOf(FormData)
    expect(form.get('name')).toBe('Cell Biology')
    expect(form.getAll('uploads')).toHaveLength(2)
  })

  it('closes the modal once the module is ready', async () => {
    const user = userEvent.setup()
    stubDashboard([], [
      { method: 'POST', path: CREATIONS_PATH, status: 202, body: creation(1, {}) },
      {
        path: `${CREATIONS_PATH}/1`,
        body: creation(1, { status: 'ready', module_id: 12 }),
      },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Add module' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add module' })
    await user.type(within(dialog).getByLabelText('Module name'), 'Cell Biology')
    await user.upload(within(dialog).getByLabelText('Files'), [
      new File(['a'], 'lecture.pdf'),
    ])
    await user.click(
      within(dialog).getByRole('button', { name: 'Create module' }),
    )

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Add module' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('reports progress while the questions are being written', async () => {
    const user = userEvent.setup()
    stubDashboard([], [
      { method: 'POST', path: CREATIONS_PATH, status: 202, body: creation(1, {}) },
      { path: `${CREATIONS_PATH}/1`, body: creation(1, {}) },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Add module' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add module' })
    await user.type(within(dialog).getByLabelText('Module name'), 'Cell Biology')
    await user.upload(within(dialog).getByLabelText('Files'), [
      new File(['a'], 'lecture.pdf'),
    ])
    await user.click(
      within(dialog).getByRole('button', { name: 'Create module' }),
    )

    expect(await screen.findByRole('status')).toHaveTextContent(
      /writing study questions/i,
    )
  })

  it('surfaces a failed creation with its message', async () => {
    const user = userEvent.setup()
    stubDashboard([], [
      { method: 'POST', path: CREATIONS_PATH, status: 202, body: creation(1, {}) },
      {
        path: `${CREATIONS_PATH}/1`,
        body: creation(1, {
          status: 'error',
          error_message: 'Could not read broken.docx',
        }),
      },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Add module' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add module' })
    await user.type(within(dialog).getByLabelText('Module name'), 'Cell Biology')
    await user.upload(within(dialog).getByLabelText('Files'), [
      new File(['a'], 'broken.docx'),
    ])
    await user.click(
      within(dialog).getByRole('button', { name: 'Create module' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not read broken.docx',
    )
  })

  it('surfaces the backend error when the creation is rejected', async () => {
    const user = userEvent.setup()
    stubDashboard([], [
      {
        method: 'POST',
        path: CREATIONS_PATH,
        status: 400,
        body: { detail: 'At most 5 files per module' },
      },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Add module' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add module' })
    await user.type(within(dialog).getByLabelText('Module name'), 'Cell Biology')
    await user.upload(within(dialog).getByLabelText('Files'), [
      new File(['a'], 'lecture.pdf'),
    ])
    await user.click(
      within(dialog).getByRole('button', { name: 'Create module' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'At most 5 files per module',
    )
  })
})
