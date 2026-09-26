import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderApp, stubApi } from './helpers'
import type { StubResponse } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

const MODULE_ID = 11

const ATTEMPT = {
  id: 500,
  module_id: MODULE_ID,
  mode: 'mcq',
  total_questions: 2,
  score: null,
  started_at: '2026-01-01T00:00:00Z',
  completed_at: null,
}

const QUESTIONS = [
  {
    id: 1,
    prompt: 'What is the capital of Australia?',
    options: ['Canberra', 'Sydney', 'Melbourne', 'Perth'],
  },
  {
    id: 2,
    prompt: 'How many chromosomes do humans have?',
    options: ['46', '23', '44', '48'],
  },
]

const START_PATH = '/api/attempts'
const QUESTIONS_PATH = `/api/modules/${MODULE_ID}/questions?mode=mcq&count=2`
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

async function answerFirstQuestion(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText(QUESTIONS[0].prompt)
  await user.click(screen.getByRole('radio', { name: 'Canberra' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('starting the run', () => {
  it('starts a scored mcq attempt before loading questions', async () => {
    const api = stubQuiz()

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)

    await screen.findByText(QUESTIONS[0].prompt)

    expect(api.calls.indexOf(`POST ${START_PATH}`)).toBeGreaterThanOrEqual(0)
    expect(api.calls.indexOf(`POST ${START_PATH}`)).toBeLessThan(
      api.calls.indexOf(`GET ${QUESTIONS_PATH}`),
    )

    const startRequest = api.requests.find(
      (request) => request.method === 'POST' && request.path === START_PATH,
    )
    expect(JSON.parse(String(startRequest?.body))).toEqual({
      module_id: MODULE_ID,
      mode: 'mcq',
      count: 2,
    })
  })

  it('reports a failure to start instead of showing a broken quiz', async () => {
    stubApi([
      { path: '/api/users/me', body: USER },
      {
        method: 'POST',
        path: START_PATH,
        status: 400,
        body: { detail: 'Module has no questions to attempt' },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/mcq`)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Module has no questions to attempt',
    )
  })
})

describe('answering questions', () => {
  it('renders every question on one page', async () => {
    stubQuiz()

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)

    expect(await screen.findByText(QUESTIONS[0].prompt)).toBeInTheDocument()
    expect(screen.getByText(QUESTIONS[1].prompt)).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(8)
  })

  it('marks the answer inline and locks the question after one choice', async () => {
    const user = userEvent.setup()
    const api = stubQuiz([
      {
        method: 'POST',
        path: ANSWER_PATH,
        body: { question_id: 1, user_answer: 'Canberra', is_correct: true },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await answerFirstQuestion(user)

    expect(await screen.findByText('Correct')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Canberra' })).toBeChecked()

    const answerCalls = api.calls.filter((call) => call === `POST ${ANSWER_PATH}`)
    expect(answerCalls).toHaveLength(1)

    await user.click(screen.getByRole('radio', { name: 'Sydney' }))

    expect(api.calls.filter((call) => call === `POST ${ANSWER_PATH}`)).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'Canberra' })).toBeChecked()
  })

  it('sends one answer request per question', async () => {
    const user = userEvent.setup()
    const api = stubQuiz([
      {
        method: 'POST',
        path: ANSWER_PATH,
        body: { question_id: 1, user_answer: 'Canberra', is_correct: true },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await answerFirstQuestion(user)
    await screen.findByText('Correct')

    const answerRequest = api.requests.find(
      (request) => request.method === 'POST' && request.path === ANSWER_PATH,
    )
    expect(JSON.parse(String(answerRequest?.body))).toEqual({
      question_id: 1,
      user_answer: 'Canberra',
    })
  })

  it('shows an incorrect mark from the server response', async () => {
    const user = userEvent.setup()
    stubQuiz([
      {
        method: 'POST',
        path: ANSWER_PATH,
        body: { question_id: 1, user_answer: 'Sydney', is_correct: false },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('radio', { name: 'Sydney' }))

    expect(await screen.findByText('Incorrect')).toBeInTheDocument()
  })
})

describe('submitting', () => {
  it('scores the attempt and locks the whole page', async () => {
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

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await answerFirstQuestion(user)
    await screen.findByText('Correct')

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('You scored 1 out of 2')).toBeInTheDocument()
    expect(api.calls).toContain(`POST ${COMPLETE_PATH}`)
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeDisabled()
  })

  it('marks unanswered questions once the attempt is complete', async () => {
    const user = userEvent.setup()
    stubQuiz([
      {
        method: 'POST',
        path: COMPLETE_PATH,
        body: { ...ATTEMPT, score: 0, completed_at: '2026-01-01T00:10:00Z' },
      },
    ])

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await screen.findByText('You scored 0 out of 2')
    expect(screen.getAllByText('Not answered')).toHaveLength(2)
  })
})

describe('abandoning an unfinished attempt', () => {
  it('asks for confirmation before leaving the page', async () => {
    const user = userEvent.setup()
    stubQuiz()

    renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)

    await user.click(screen.getByRole('link', { name: /back to your modules/i }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Leave without finishing?',
    })
    expect(dialog).toHaveTextContent(/won't be scored/i)
  })

  it('stays on the quiz when the user keeps studying', async () => {
    const user = userEvent.setup()
    stubQuiz()

    const { router } = renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('link', { name: /back to your modules/i }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Leave without finishing?',
    })

    await user.click(within(dialog).getByRole('button', { name: 'Keep studying' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(router.state.location.pathname).toBe(`/modules/${MODULE_ID}/mcq`)
  })

  it('leaves the quiz when the user confirms', async () => {
    const user = userEvent.setup()
    stubQuiz([
      { path: '/api/modules', body: [] },
      { path: '/api/files', body: [] },
    ])

    const { router } = renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('link', { name: /back to your modules/i }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Leave without finishing?',
    })

    await user.click(within(dialog).getByRole('button', { name: 'Leave' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
  })

  it('stops warning once the attempt has been scored', async () => {
    const user = userEvent.setup()
    stubQuiz([
      {
        method: 'POST',
        path: COMPLETE_PATH,
        body: { ...ATTEMPT, score: 0, completed_at: '2026-01-01T00:10:00Z' },
      },
      { path: '/api/modules', body: [] },
      { path: '/api/files', body: [] },
    ])

    const { router } = renderApp(`/modules/${MODULE_ID}/mcq?count=2`)
    await screen.findByText(QUESTIONS[0].prompt)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await screen.findByText('You scored 0 out of 2')

    await user.click(screen.getByRole('link', { name: /back to your modules/i }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
