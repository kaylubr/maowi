import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderApp, stubApi } from './helpers'

const USER = {
  id: 1,
  email: 'student@example.com',
  username: 'student',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const MODULE_ID = 11

const CARDS = [
  { id: 1, prompt: 'What is the capital of Australia?', answer: 'Canberra' },
  { id: 2, prompt: 'How many chromosomes do humans have?', answer: '46' },
  {
    id: 3,
    prompt: 'What is the powerhouse of the cell?',
    answer: 'Mitochondria',
  },
]

function stubFlashcards(path = `/api/modules/${MODULE_ID}/questions?mode=flashcard`) {
  return stubApi([
    { path: '/api/users/me', body: USER },
    { path, body: CARDS },
  ])
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('flashcard page', () => {
  it('shows the first prompt with the answer hidden', async () => {
    stubFlashcards()

    renderApp(`/modules/${MODULE_ID}/flashcard`)

    expect(await screen.findByText(CARDS[0].prompt)).toBeInTheDocument()
    expect(screen.queryByText(CARDS[0].answer)).not.toBeInTheDocument()
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
  })

  it('reveals the answer when the card is flipped', async () => {
    const user = userEvent.setup()
    stubFlashcards()
    renderApp(`/modules/${MODULE_ID}/flashcard`)

    await user.click(await screen.findByRole('button', { name: /click to reveal/i }))

    expect(screen.getByText(CARDS[0].answer)).toBeInTheDocument()
    expect(screen.queryByText(CARDS[0].prompt)).not.toBeInTheDocument()
  })

  it('advances to the next card and hides the answer again', async () => {
    const user = userEvent.setup()
    stubFlashcards()
    renderApp(`/modules/${MODULE_ID}/flashcard`)

    await user.click(await screen.findByRole('button', { name: /click to reveal/i }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByText(CARDS[1].prompt)).toBeInTheDocument()
    expect(screen.queryByText(CARDS[1].answer)).not.toBeInTheDocument()
    expect(screen.getByText('Card 2 of 3')).toBeInTheDocument()
  })

  it('walks back to the previous card', async () => {
    const user = userEvent.setup()
    stubFlashcards()
    renderApp(`/modules/${MODULE_ID}/flashcard`)

    await screen.findByText(CARDS[0].prompt)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(screen.getByText(CARDS[0].prompt)).toBeInTheDocument()
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
  })

  it('disables navigation at the ends of the deck', async () => {
    const user = userEvent.setup()
    stubFlashcards()
    renderApp(`/modules/${MODULE_ID}/flashcard`)

    await screen.findByText(CARDS[0].prompt)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByText('Card 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('passes the count from the url and never starts a scored attempt', async () => {
    const user = userEvent.setup()
    const api = stubFlashcards(
      `/api/modules/${MODULE_ID}/questions?mode=flashcard&count=2`,
    )

    renderApp(`/modules/${MODULE_ID}/flashcard?count=2`)

    await screen.findByText(CARDS[0].prompt)
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(api.calls).toContain(
      `GET /api/modules/${MODULE_ID}/questions?mode=flashcard&count=2`,
    )
    expect(api.calls.filter((call) => call.startsWith('POST'))).toEqual([])
  })

  it('says so when the module has no questions', async () => {
    stubApi([
      { path: '/api/users/me', body: USER },
      { path: `/api/modules/${MODULE_ID}/questions?mode=flashcard`, body: [] },
    ])

    renderApp(`/modules/${MODULE_ID}/flashcard`)

    await waitFor(() =>
      expect(screen.getByText(/no questions to study yet/i)).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: /back to your modules/i })).toBeInTheDocument()
  })
})
