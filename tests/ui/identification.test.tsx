import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dashboardStub, renderApp, stubApi } from './helpers'
import type { StubResponse } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

const MODULE_ID = 11

const ATTEMPT = {
  id: 700,
  module_id: MODULE_ID,
  mode: 'identification',
  total_questions: 2,
  score: null,
  started_at: '2026-01-01T00:00:00Z',
  completed_at: null,
}

const QUESTIONS = [
  { id: 1, prompt: 'What is the capital of Australia?' },
  { id: 2, prompt: 'How many chromosomes do humans have?' },
]

const START_PATH = '/api/attempts'
const QUESTIONS_PATH = `/api/modules/${MODULE_ID}/questions?mode=identification&count=2`
const ANSWER_PATH = `/api/attempts/${ATTEMPT.id}/answers`
const COMPLETE_PATH = `/api/attempts/${ATTEMPT.id}/complete`

function stubQuiz(extra: StubResponse[] = []) {
  return stubApi([
    { path: '/api/users/me', body: USER },
    { method: 'POST', path: START_PATH, status: 201, body: ATTEMPT },
    { path: QUESTIONS_PATH, body: QUESTIONS },
    ...extra,
  ])
}

async function answerFirstQuestion(
  user: ReturnType<typeof userEvent.setup>,
  value = 'Canberra',
) {
  await screen.findByText(QUESTIONS[0].prompt)
  await user.type(screen.getByLabelText('Answer for question 1'), value)
  await user.click(screen.getByRole('button', { name: 'Check question 1' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('identification page', () => {
  it('starts an identification attempt and renders a text box per question', async () => {
    const api = stubQuiz()

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)

    expect(await screen.findByText(QUESTIONS[0].prompt)).toBeInTheDocument()
    expect(screen.getByLabelText('Answer for question 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Answer for question 2')).toBeInTheDocument()

    const startRequest = api.requests.find(
      (request) => request.method === 'POST' && request.path === START_PATH,
    )
    expect(JSON.parse(String(startRequest?.body))).toEqual({
      module_id: MODULE_ID,
      mode: 'identification',
      count: 2,
    })
  })

  it('cannot check an empty answer', async () => {
    const user = userEvent.setup()
    stubQuiz()

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)

    await screen.findByText(QUESTIONS[0].prompt)
    expect(screen.getByRole('button', { name: 'Check question 1' })).toBeDisabled()

    await user.type(screen.getByLabelText('Answer for question 1'), '   ')

    expect(screen.getByRole('button', { name: 'Check question 1' })).toBeDisabled()
  })

  it('marks the answer inline and locks the question', async () => {
    const user = userEvent.setup()
    const api = stubQuiz([
      {
        method: 'POST',
        path: ANSWER_PATH,
        body: { question_id: 1, user_answer: 'Canberra', is_correct: true },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await answerFirstQuestion(user)

    expect(await screen.findByText('Correct')).toBeInTheDocument()
    expect(screen.getByLabelText('Answer for question 1')).toBeDisabled()

    await user.type(screen.getByLabelText('Answer for question 1'), 'extra')
    expect(api.calls.filter((call) => call === `POST ${ANSWER_PATH}`)).toHaveLength(1)
  })

  it('sends the trimmed answer to the server', async () => {
    const user = userEvent.setup()
    const api = stubQuiz([
      {
        method: 'POST',
        path: ANSWER_PATH,
        body: { question_id: 1, user_answer: 'Canberra', is_correct: true },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await answerFirstQuestion(user, '  Canberra  ')

    await screen.findByText('Correct')
    const answerRequest = api.requests.find(
      (request) => request.method === 'POST' && request.path === ANSWER_PATH,
    )
    expect(JSON.parse(String(answerRequest?.body))).toEqual({
      question_id: 1,
      user_answer: 'Canberra',
    })
  })

  it('trusts the server verdict instead of matching case locally', async () => {
    const user = userEvent.setup()
    stubQuiz([
      {
        method: 'POST',
        path: ANSWER_PATH,
        body: { question_id: 1, user_answer: 'canberra', is_correct: false },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await answerFirstQuestion(user, 'canberra')

    expect(await screen.findByText('Incorrect')).toBeInTheDocument()
    expect(screen.queryByText('Correct')).not.toBeInTheDocument()
  })
})

describe('scoring an identification run', () => {
  it('scores the attempt and locks the page', async () => {
    const user = userEvent.setup()
    const api = stubQuiz([
      {
        method: 'POST',
        path: ANSWER_PATH,
        body: { question_id: 1, user_answer: 'Canberra', is_correct: true },
      },
      {
        method: 'POST',
        path: COMPLETE_PATH,
        body: { ...ATTEMPT, score: 1, completed_at: '2026-01-01T00:10:00Z' },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await answerFirstQuestion(user)
    await screen.findByText('Correct')

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('You scored 1 out of 2')).toBeInTheDocument()
    expect(api.calls).toContain(`POST ${COMPLETE_PATH}`)
    expect(screen.getByLabelText('Answer for question 2')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  })

  it('marks skipped questions once the attempt is complete', async () => {
    const user = userEvent.setup()
    stubQuiz([
      {
        method: 'POST',
        path: COMPLETE_PATH,
        body: { ...ATTEMPT, score: 0, completed_at: '2026-01-01T00:10:00Z' },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await screen.findByText('You scored 0 out of 2')
    expect(screen.getAllByText('Not answered')).toHaveLength(2)
  })
})

describe('abandoning an identification attempt', () => {
  it('warns before navigating away while unfinished', async () => {
    const user = userEvent.setup()
    stubQuiz()

    renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)

    await user.click(screen.getByRole('link', { name: /back to your modules/i }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Leave without finishing?',
    })
    expect(dialog).toHaveTextContent(/won't be scored/i)
  })

  it('leaves when the warning is confirmed', async () => {
    const user = userEvent.setup()
    stubQuiz([
      dashboardStub(),
    ])

    const { router } = renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('link', { name: /back to your modules/i }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Leave without finishing?',
    })

    await user.click(within(dialog).getByRole('button', { name: 'Leave' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
  })

  it('stops warning after the attempt is scored', async () => {
    const user = userEvent.setup()
    stubQuiz([
      {
        method: 'POST',
        path: COMPLETE_PATH,
        body: { ...ATTEMPT, score: 0, completed_at: '2026-01-01T00:10:00Z' },
      },
      dashboardStub(),
    ])

    const { router } = renderApp(`/modules/${MODULE_ID}/identification?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await screen.findByText('You scored 0 out of 2')

    await user.click(screen.getByRole('link', { name: /back to your modules/i }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
