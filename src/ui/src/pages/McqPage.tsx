import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import type { Attempt, AttemptAnswer } from '../api/attempts'
import type { MultipleChoiceQuestion } from '../api/questions'
import { parseCountParam } from '../api/questions'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { GlassCard } from '../components/ui/GlassCard'
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
      <div className="space-y-4">
        <p role="alert" className="text-red-300">
          {error}
        </p>
        <Link to="/dashboard" className="text-sm underline">
          Back to your modules
        </Link>
      </div>
    )
  }

  if (!attempt) {
    return <p className="text-white/60">Preparing your quiz…</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/dashboard" className="text-sm text-white/70 hover:text-white">
          ← Back to your modules
        </Link>
        <span className="text-sm text-white/60">
          {isComplete
            ? 'Attempt complete'
            : `Answered ${answeredCount} of ${questions.length}`}
        </span>
      </div>

      {isComplete ? (
        <div
          role="status"
          className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-white shadow-xl backdrop-blur-md"
        >
          <p className="text-2xl font-semibold">
            You scored {completed.score} out of {completed.total_questions}
          </p>
          <p className="mt-1 text-sm text-white/70">
            This attempt has been locked and scored.
          </p>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-red-300">
          {actionError}
        </p>
      ) : null}

      {questionsQuery.isPending ? (
        <p className="text-white/60">Loading questions…</p>
      ) : null}

      {questionsQuery.isError ? (
        <p role="alert" className="text-red-300">
          {questionsQuery.error.message}
        </p>
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
        <div className="flex items-center justify-end gap-4">
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
    <GlassCard>
      <p className="mb-4 text-white">
        <span className="mr-2 text-white/50">{position + 1}.</span>
        {question.prompt}
      </p>

      <div className="space-y-2">
        {question.options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-3 rounded-xl border border-white/10 p-3 text-sm ${
              isLocked ? 'text-white/60' : 'cursor-pointer hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option}
              checked={result?.user_answer === option}
              disabled={isLocked || isPending}
              onChange={() => onChoose(question, option)}
              className="h-4 w-4"
            />
            {option}
          </label>
        ))}
      </div>

      {result ? (
        <p
          role="status"
          className={`mt-4 text-sm font-medium ${
            result.is_correct ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {result.is_correct ? 'Correct' : 'Incorrect'}
        </p>
      ) : null}

      {isPending ? <p className="mt-4 text-sm text-white/50">Saving…</p> : null}

      {isComplete && !result ? (
        <p className="mt-4 text-sm text-white/50">Not answered</p>
      ) : null}
    </GlassCard>
  )
}
