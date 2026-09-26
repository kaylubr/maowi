import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import type { Attempt, AttemptAnswer } from '../api/attempts'
import type { IdentificationQuestion } from '../api/questions'
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
import { useIdentificationQuestions } from '../hooks/useQuestions'

const INPUT_CLASSES =
  'w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/50'

export function IdentificationPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const moduleId = Number(id)
  const count = parseCountParam(searchParams.get('count'))

  const { attempt, error } = useAttemptRun(moduleId, 'identification', count)

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
    <IdentificationQuiz
      key={attempt.id}
      attempt={attempt}
      moduleId={moduleId}
      count={count}
    />
  )
}

function IdentificationQuiz({
  attempt,
  moduleId,
  count,
}: {
  attempt: Attempt
  moduleId: number
  count?: number
}) {
  const questionsQuery = useIdentificationQuestions(moduleId, count)
  const submitAnswer = useSubmitAttemptAnswer()
  const completeAttempt = useCompleteAttempt()

  const [answers, setAnswers] = useState<Record<number, AttemptAnswer>>({})
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [pendingQuestionId, setPendingQuestionId] = useState<number | null>(null)
  const [completed, setCompleted] = useState<Attempt | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const questions = questionsQuery.data ?? []
  const isComplete = completed !== null
  const answeredCount = Object.keys(answers).length

  const blocker = useAbandonProtection(!isComplete)

  const check = async (
    question: IdentificationQuestion,
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const draft = (drafts[question.id] ?? '').trim()
    if (isComplete || answers[question.id] || draft === '') {
      return
    }
    if (pendingQuestionId !== null) {
      return
    }

    setActionError(null)
    setPendingQuestionId(question.id)

    try {
      const answer = await submitAnswer.mutateAsync({
        attemptId: attempt.id,
        questionId: question.id,
        userAnswer: draft,
      })
      setAnswers((current) => ({ ...current, [question.id]: answer }))
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
          draft={drafts[question.id] ?? ''}
          result={answers[question.id]}
          isComplete={isComplete}
          isPending={pendingQuestionId === question.id}
          onDraft={(value) =>
            setDrafts((current) => ({ ...current, [question.id]: value }))
          }
          onCheck={check}
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
  draft,
  result,
  isComplete,
  isPending,
  onDraft,
  onCheck,
}: {
  question: IdentificationQuestion
  position: number
  draft: string
  result: AttemptAnswer | undefined
  isComplete: boolean
  isPending: boolean
  onDraft: (value: string) => void
  onCheck: (
    question: IdentificationQuestion,
    event: FormEvent<HTMLFormElement>,
  ) => void
}) {
  const isLocked = isComplete || result !== undefined

  return (
    <GlassCard>
      <p className="mb-4 text-white">
        <span className="mr-2 text-white/50">{position + 1}.</span>
        {question.prompt}
      </p>

      <form
        onSubmit={(event) => onCheck(question, event)}
        className="flex flex-wrap items-start gap-3"
      >
        <input
          aria-label={`Answer for question ${position + 1}`}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          disabled={isLocked}
          placeholder="Type the exact answer"
          className={`${INPUT_CLASSES} flex-1`}
        />
        <Button type="submit" disabled={isLocked || isPending || draft.trim() === ''}>
          {isPending ? 'Checking…' : `Check question ${position + 1}`}
        </Button>
      </form>

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

      {isComplete && !result ? (
        <p className="mt-4 text-sm text-white/50">Not answered</p>
      ) : null}
    </GlassCard>
  )
}
