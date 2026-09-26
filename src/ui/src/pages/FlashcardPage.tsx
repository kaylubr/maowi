import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { GlassCard } from '../components/ui/GlassCard'
import { useFlashcardQuestions } from '../hooks/useQuestions'

export function FlashcardPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const moduleId = Number(id)
  const count = parseCount(searchParams.get('count'))

  const questionsQuery = useFlashcardQuestions(moduleId, count)
  const questions = questionsQuery.data ?? []

  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const goTo = (nextIndex: number) => {
    setIndex(nextIndex)
    setShowAnswer(false)
  }

  if (!Number.isInteger(moduleId)) {
    return <p className="text-red-300">This module could not be found.</p>
  }

  if (questionsQuery.isPending) {
    return <p className="text-white/60">Loading flashcards…</p>
  }

  if (questionsQuery.isError) {
    return (
      <p role="alert" className="text-red-300">
        {questionsQuery.error.message}
      </p>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-white/70">This module has no questions to study yet.</p>
        <Link to="/dashboard" className="text-sm underline">
          Back to your modules
        </Link>
      </div>
    )
  }

  const question = questions[index]
  const isFirst = index === 0
  const isLast = index === questions.length - 1

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/dashboard" className="text-sm text-white/70 hover:text-white">
          ← Back to your modules
        </Link>
        <span className="text-sm text-white/60">
          Card {index + 1} of {questions.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setShowAnswer((current) => !current)}
        className="flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-8 text-white shadow-xl backdrop-blur-md transition hover:bg-white/15"
      >
        <span className="text-xs font-medium uppercase tracking-widest text-white/50">
          {showAnswer ? 'Answer' : 'Question'}
        </span>
        <span className="text-center text-2xl">
          {showAnswer ? question.answer : question.prompt}
        </span>
        <span className="text-xs text-white/40">
          {showAnswer ? 'Click to see the question' : 'Click to reveal the answer'}
        </span>
      </button>

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => goTo(index - 1)} disabled={isFirst}>
          Previous
        </Button>
        <Button variant="ghost" onClick={() => goTo(index + 1)} disabled={isLast}>
          Next
        </Button>
      </div>

      <GlassCard className="p-4">
        <p className="text-xs text-white/50">
          Flashcards are not scored. Flip through as many times as you like.
        </p>
      </GlassCard>
    </div>
  )
}

function parseCount(value: string | null): number | undefined {
  if (value === null) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}
