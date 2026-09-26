import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { UploadedFile } from '../../src/ui/src/api/files'
import type { StudyModule } from '../../src/ui/src/api/modules'
import { hasUnfinishedFiles } from '../../src/ui/src/hooks/useFiles'
import { hasUnfinishedModules } from '../../src/ui/src/hooks/useModules'
import { renderApp, stubApi } from './helpers'

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

const PARSED_FILE: UploadedFile = {
  id: 100,
  filename: 'lecture.pdf',
  file_type: 'pdf',
  status: 'parsed',
  error_message: null,
  module_id: null,
}

const ASSIGNED_FILE: UploadedFile = {
  ...PARSED_FILE,
  id: 101,
  filename: 'assigned.docx',
  module_id: DRAFT_MODULE.id,
}

const PARSING_FILE: UploadedFile = {
  ...PARSED_FILE,
  id: 102,
  filename: 'still-parsing.pptx',
  status: 'parsing',
}

function stubDashboard(modules: StudyModule[], files: UploadedFile[]) {
  return stubApi([
    { path: '/api/users/me', body: USER },
    { path: '/api/modules', body: modules },
    { path: '/api/files', body: files },
  ])
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dashboard', () => {
  it('lists modules with their status', async () => {
    stubDashboard([DRAFT_MODULE, READY_MODULE], [])

    renderApp('/dashboard')

    expect(await screen.findByText('Cell Biology')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('shows an empty state when there are no modules', async () => {
    stubDashboard([], [])

    renderApp('/dashboard')

    expect(await screen.findByText(/no modules yet/i)).toBeInTheDocument()
  })

  it('lists uploaded files', async () => {
    stubDashboard([], [PARSED_FILE, PARSING_FILE])

    renderApp('/dashboard')

    expect(await screen.findByText('lecture.pdf')).toBeInTheDocument()
    expect(screen.getByText('still-parsing.pptx')).toBeInTheDocument()
  })

  it('reports a module failure message', async () => {
    stubDashboard(
      [{ ...DRAFT_MODULE, status: 'failed', error_message: 'Gemini exploded' }],
      [],
    )

    renderApp('/dashboard')

    expect(await screen.findByText('Gemini exploded')).toBeInTheDocument()
  })
})

describe('upload modal', () => {
  it('rejects a selection larger than the backend cap before calling the api', async () => {
    const user = userEvent.setup()
    const api = stubDashboard([], [])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Upload files' }))
    const tooMany = Array.from(
      { length: 6 },
      (_, index) => new File(['x'], `notes-${index}.pdf`),
    )
    await user.upload(screen.getByLabelText('Choose files'), tooMany)

    expect(await screen.findByRole('alert')).toHaveTextContent(/at most 5/i)
    expect(api.calls).not.toContain('POST /api/files')
  })

  it('posts the chosen files as multipart form data', async () => {
    const user = userEvent.setup()
    const api = stubApi([
      { path: '/api/users/me', body: USER },
      { path: '/api/modules', body: [] },
      { path: '/api/files', body: [] },
      { method: 'POST', path: '/api/files', status: 201, body: [] },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Upload files' }))
    await user.upload(screen.getByLabelText('Choose files'), [
      new File(['a'], 'lecture.pdf'),
      new File(['b'], 'notes.docx'),
    ])
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(api.calls).toContain('POST /api/files'))

    const uploadRequest = api.requests.find(
      (request) => request.method === 'POST' && request.path === '/api/files',
    )
    const form = uploadRequest?.body as FormData
    expect(form).toBeInstanceOf(FormData)
    expect(form.getAll('uploads')).toHaveLength(2)
  })

  it('surfaces the backend error when the upload is rejected', async () => {
    const user = userEvent.setup()
    stubApi([
      { path: '/api/users/me', body: USER },
      { path: '/api/modules', body: [] },
      { path: '/api/files', body: [] },
      {
        method: 'POST',
        path: '/api/files',
        status: 401,
        body: { detail: 'Not authenticated' },
      },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Upload files' }))
    await user.upload(
      screen.getByLabelText('Choose files'),
      new File(['x'], 'lecture.pdf'),
    )
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Not authenticated')
  })
})

describe('create module modal', () => {
  it('offers only parsed files that are not yet in a module', async () => {
    const user = userEvent.setup()
    stubDashboard([], [PARSED_FILE, ASSIGNED_FILE, PARSING_FILE])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'New module' }))

    const dialog = await screen.findByRole('dialog', { name: 'Create module' })
    const options = within(dialog).getAllByRole('checkbox')
    expect(options).toHaveLength(1)
    expect(within(dialog).getByText('lecture.pdf')).toBeInTheDocument()
    expect(within(dialog).queryByText('assigned.docx')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('still-parsing.pptx')).not.toBeInTheDocument()
  })

  it('creates a module from the selected files', async () => {
    const user = userEvent.setup()
    const api = stubApi([
      { path: '/api/users/me', body: USER },
      { path: '/api/modules', body: [] },
      { path: '/api/files', body: [PARSED_FILE] },
      {
        method: 'POST',
        path: '/api/modules',
        status: 201,
        body: { id: 12, name: 'Cell Biology', status: 'draft', error_message: null },
      },
    ])
    renderApp('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'New module' }))
    const dialog = await screen.findByRole('dialog', { name: 'Create module' })
    await user.type(within(dialog).getByLabelText('Module name'), 'Cell Biology')
    await user.click(within(dialog).getByRole('checkbox'))
    await user.click(within(dialog).getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(api.calls).toContain('POST /api/modules'))

    const createRequest = api.requests.find(
      (request) => request.method === 'POST' && request.path === '/api/modules',
    )
    expect(JSON.parse(String(createRequest?.body))).toEqual({
      name: 'Cell Biology',
      file_ids: [PARSED_FILE.id],
    })
  })
})

describe('status polling', () => {
  it('keeps polling only while files are still being parsed', () => {
    expect(hasUnfinishedFiles([PARSED_FILE])).toBe(false)
    expect(hasUnfinishedFiles([PARSING_FILE])).toBe(true)
    expect(hasUnfinishedFiles([{ ...PARSED_FILE, status: 'uploaded' }])).toBe(true)
    expect(hasUnfinishedFiles([{ ...PARSED_FILE, status: 'failed' }])).toBe(false)
  })

  it('keeps polling only while modules are draft or generating', () => {
    expect(hasUnfinishedModules([READY_MODULE])).toBe(false)
    expect(hasUnfinishedModules([DRAFT_MODULE])).toBe(true)
    expect(hasUnfinishedModules([{ ...READY_MODULE, status: 'generating' }])).toBe(
      true,
    )
    expect(hasUnfinishedModules([{ ...READY_MODULE, status: 'failed' }])).toBe(false)
  })
})
