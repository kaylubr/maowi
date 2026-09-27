import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import type { Attempt, AttemptAnswer } from '../api/attempts'
import type { MultipleChoiceQuestion } from '../api/questions'
import { parseCountParam } from '../api/questions'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { ErrorText } from '../components/ui/typography'
import {
  useAbandonProtection,
  useAttemptRun,
  useCompleteAttempt,
  useSubmitAttemptAnswer,
} from '../hooks/useAttempts'
import { useMultipleChoiceQuestions } from '../hooks/useQuestions'

export function McqPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const moduleId = Number(id)
  const count = parseCountParam(searchParams.get('count'))

  const { attempt, error } = useAttemptRun(moduleId, 'mcq', count)

  if (error) {
    return (
      <div>
        <ErrorText>{error}</ErrorText>
        <Link to="/dashboard">Back to your modules</Link>
      </div>
    )
  }

  if (!attempt) {
    return <p className="text-body-secondary">Preparing your quiz…</p>
  }

  return (
    <McqQuiz
      key={attempt.id}
      attempt={attempt}
      moduleId={moduleId}
      count={count}
    />
  )
}

function McqQuiz({
  attempt,
  moduleId,
  count,
}: {
  attempt: Attempt
  moduleId: number
  count?: number
}) {
  const questionsQuery = useMultipleChoiceQuestions(moduleId, count)
  const submitAnswer = useSubmitAttemptAnswer()
  const completeAttempt = useCompleteAttempt()

  const [results, setResults] = useState<Record<number, AttemptAnswer>>({})
  const [pendingQuestionId, setPendingQuestionId] = useState<number | null>(null)
  const [completed, setCompleted] = useState<Attempt | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const questions = questionsQuery.data ?? []
  const isComplete = completed !== null
  const answeredCount = Object.keys(results).length

  const blocker = useAbandonProtection(!isComplete)

  const choose = async (question: MultipleChoiceQuestion, option: string) => {
    if (isComplete || results[question.id] || pendingQuestionId !== null) {
      return
    }

    setActionError(null)
    setPendingQuestionId(question.id)

    try {
      const answer = await submitAnswer.mutateAsync({
        attemptId: attempt.id,
        questionId: question.id,
        userAnswer: option,
      })
      setResults((current) => ({ ...current, [question.id]: answer }))
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'That answer could not be saved.',
      )
    } finally {
      setPendingQuestionId(null)
    }
  }

  const finish = async () => {
    setActionError(null)

    try {
      setCompleted(await completeAttempt.mutateAsync(attempt.id))
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'This attempt could not be scored.',
      )
    }
  }

  const leaveQuiz = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }

  const stayOnQuiz = () => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <Link to="/dashboard" className="btn btn-link text-decoration-none px-0">
          ← Back to your modules
        </Link>
        <span className="badge text-bg-secondary">
          {isComplete
            ? 'Attempt complete'
            : `Answered ${answeredCount} of ${questions.length}`}
        </span>
      </div>

      {isComplete ? (
        <div role="status" className="alert alert-info text-center">
          <p className="fs-4 mb-1">
            You scored {completed.score} out of {completed.total_questions}
          </p>
          <p className="small mb-0">This attempt has been locked and scored.</p>
        </div>
      ) : null}

      {actionError ? <ErrorText>{actionError}</ErrorText> : null}

      {questionsQuery.isPending ? (
        <p className="text-body-secondary">Loading questions…</p>
      ) : null}

      {questionsQuery.isError ? (
        <ErrorText>{questionsQuery.error.message}</ErrorText>
      ) : null}

      {questions.map((question, position) => (
        <QuestionBlock
          key={question.id}
          question={question}
          position={position}
          result={results[question.id]}
          isComplete={isComplete}
          isPending={pendingQuestionId === question.id}
          onChoose={choose}
        />
      ))}

      {questions.length > 0 ? (
        <div className="d-flex justify-content-end">
          <Button
            onClick={finish}
            disabled={isComplete || completeAttempt.isPending}
          >
            {completeAttempt.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      ) : null}

      <ConfirmModal
        open={blocker.state === 'blocked'}
        title="Leave without finishing?"
        message="This attempt won't be scored. Head back to your modules?"
        confirmLabel="Leave"
        cancelLabel="Keep studying"
        onConfirm={leaveQuiz}
        onCancel={stayOnQuiz}
      />
    </div>
  )
}

function QuestionBlock({
  question,
  position,
  result,
  isComplete,
  isPending,
  onChoose,
}: {
  question: MultipleChoiceQuestion
  position: number
  result: AttemptAnswer | undefined
  isComplete: boolean
  isPending: boolean
  onChoose: (question: MultipleChoiceQuestion, option: string) => void
}) {
  const isLocked = isComplete || result !== undefined

  return (
    <div className="card mb-3">
      <div className="card-body">
        <p className="mb-3">
          <span className="text-body-secondary me-2">{position + 1}.</span>
          {question.prompt}
        </p>

        {question.options.map((option, optionIndex) => {
          const optionId = `question-${question.id}-option-${optionIndex}`
          const isChosen = result?.user_answer === option

          return (
            <div className="form-check" key={optionId}>
              <input
                className="form-check-input"
                type="radio"
                name={`question-${question.id}`}
                id={optionId}
                value={option}
                checked={isChosen}
                disabled={isLocked || isPending}
                onChange={() => onChoose(question, option)}
              />
              <label
                className={`form-check-label${isChosen ? ' fw-semibold' : ''}`}
                htmlFor={optionId}
              >
                {option}
              </label>
            </div>
          )
        })}

        {result ? (
          <p
            role="status"
            className={`mt-3 mb-0 small fw-semibold ${
              result.is_correct ? 'text-success' : 'text-danger'
            }`}
          >
            {result.is_correct ? 'Correct' : 'Incorrect'}
          </p>
        ) : null}

        {isPending ? (
          <p className="mt-3 mb-0 small text-body-secondary">Saving…</p>
        ) : null}

        {isComplete && !result ? (
          <p className="mt-3 mb-0 small text-body-secondary">Not answered</p>
        ) : null}
      </div>
    </div>
  )
}
