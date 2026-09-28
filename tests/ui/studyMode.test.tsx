import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ModuleSummary } from '../../src/ui/src/api/dashboard'
import { dashboardStub, moduleSummary, renderApp, stubApi } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

const QUESTIONS = [
  { id: 1, prompt: 'What is the capital of Australia?' },
  { id: 2, prompt: 'How many chromosomes do humans have?' },
  { id: 3, prompt: 'What is the powerhouse of the cell?' },
]

const CELL_BIOLOGY = moduleSummary(
  { id: 10, name: 'Cell Biology' },
  { question_count: QUESTIONS.length },
)

const READY_MODULE = moduleSummary(
  { id: 11, name: 'Photosynthesis' },
  { question_count: QUESTIONS.length },
)

function stubDashboard(modules: ModuleSummary[]) {
  return stubApi([
    { path: '/api/users/me', body: USER },
    dashboardStub(modules),
  ])
}

async function openStudyModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', { name: `Study ${READY_MODULE.name}` }),
  )
  return screen.findByRole('dialog', { name: `Study ${READY_MODULE.name}` })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('study mode selection', () => {
  it('offers study on every module', async () => {
    stubDashboard([CELL_BIOLOGY, READY_MODULE])

    renderApp('/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Study Photosynthesis' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Study Cell Biology' }),
    ).toBeInTheDocument()
  })

  it('offers the three study modes with flashcards preselected', async () => {
    const user = userEvent.setup()
    stubDashboard([READY_MODULE])
    renderApp('/dashboard')

    const dialog = await openStudyModal(user)

    const modes = within(dialog).getAllByRole('radio')
    expect(modes.map((radio) => radio.getAttribute('value'))).toEqual([
      'flashcard',
      'mcq',
      'identification',
    ])
    expect(within(dialog).getByRole('radio', { name: /flashcard/i })).toBeChecked()
  })

  it('defaults the count to the module total and caps it there', async () => {
    const user = userEvent.setup()
    stubDashboard([READY_MODULE])
    renderApp('/dashboard')

    const dialog = await openStudyModal(user)

    const count = within(dialog).getByLabelText('Number of questions')
    expect(count).toHaveValue(QUESTIONS.length)
    expect(count).toHaveAttribute('max', String(QUESTIONS.length))
    expect(dialog).toHaveTextContent('This module has 3 questions.')

    await user.clear(count)
    await user.type(count, '99')
    await user.tab()

    await waitFor(() => expect(count).toHaveValue(QUESTIONS.length))
  })

  it('never requests more questions than the module holds', async () => {
    const user = userEvent.setup()
    stubDashboard([READY_MODULE])
    const { router } = renderApp('/dashboard')

    const dialog = await openStudyModal(user)
    const count = within(dialog).getByLabelText('Number of questions')
    await user.clear(count)
    await user.type(count, '99')
    await user.click(within(dialog).getByRole('button', { name: 'Start studying' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/modules/${READY_MODULE.id}/flashcard`,
      ),
    )
    expect(router.state.location.search).toBe(`?count=${QUESTIONS.length}`)
  })

  it('navigates to the chosen mode with the count', async () => {
    const user = userEvent.setup()
    stubDashboard([READY_MODULE])
    const { router } = renderApp('/dashboard')

    const dialog = await openStudyModal(user)
    await user.click(within(dialog).getByRole('radio', { name: /multiple choice/i }))
    const count = within(dialog).getByLabelText('Number of questions')
    await user.clear(count)
    await user.type(count, '2')
    await user.click(within(dialog).getByRole('button', { name: 'Start studying' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/modules/${READY_MODULE.id}/mcq`,
      ),
    )
    expect(router.state.location.search).toBe('?count=2')
  })

  it('closes without navigating when cancelled', async () => {
    const user = userEvent.setup()
    stubDashboard([READY_MODULE])
    const { router } = renderApp('/dashboard')

    const dialog = await openStudyModal(user)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: `Study ${READY_MODULE.name}` }),
      ).not.toBeInTheDocument(),
    )
    expect(router.state.location.pathname).toBe('/dashboard')
  })
})
