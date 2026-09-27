import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { parseCountParam } from '../api/questions'
import { Button } from '../components/ui/Button'
import { ErrorText } from '../components/ui/typography'
import { useFlashcardQuestions } from '../hooks/useQuestions'

export function FlashcardPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const moduleId = Number(id)
  const count = parseCountParam(searchParams.get('count'))

  const questionsQuery = useFlashcardQuestions(moduleId, count)
  const questions = questionsQuery.data ?? []

  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const goTo = (nextIndex: number) => {
    setIndex(nextIndex)
    setShowAnswer(false)
  }

  if (!Number.isInteger(moduleId)) {
    return <ErrorText>This module could not be found.</ErrorText>
  }

  if (questionsQuery.isPending) {
    return <p className="text-body-secondary">Loading flashcards…</p>
  }

  if (questionsQuery.isError) {
    return <ErrorText>{questionsQuery.error.message}</ErrorText>
  }

  if (questions.length === 0) {
    return (
      <div>
        <p className="text-body-secondary">
          This module has no questions to study yet.
        </p>
        <Link to="/dashboard">Back to your modules</Link>
      </div>
    )
  }

  const question = questions[index]
  const isFirst = index === 0
  const isLast = index === questions.length - 1

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
          <Link to="/dashboard" className="btn btn-link text-decoration-none px-0">
            ← Back to your modules
          </Link>
          <span className="badge text-bg-secondary">
            Card {index + 1} of {questions.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAnswer((current) => !current)}
          className="btn btn-secondary w-100 d-flex flex-column justify-content-center align-items-center gap-3 py-5"
          style={{ minHeight: '16rem' }}
        >
          <span className="badge text-bg-secondary">
            {showAnswer ? 'Answer' : 'Question'}
          </span>
          <span className="fs-3 text-body">
            {showAnswer ? question.answer : question.prompt}
          </span>
          <span className="small text-body-secondary">
            {showAnswer ? 'Click to see the question' : 'Click to reveal the answer'}
          </span>
        </button>

        <div className="d-flex justify-content-between gap-2 mt-3">
          <Button variant="secondary" onClick={() => goTo(index - 1)} disabled={isFirst}>
            Previous
          </Button>
          <Button variant="secondary" onClick={() => goTo(index + 1)} disabled={isLast}>
            Next
          </Button>
        </div>

        <p className="small text-body-secondary mt-3 mb-0">
          Flashcards are not scored. Flip through as many times as you like.
        </p>
      </div>
    </div>
  )
}
