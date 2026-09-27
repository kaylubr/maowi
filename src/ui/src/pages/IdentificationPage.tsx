import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Attempt, AttemptAnswer } from '../api/attempts'
import type { IdentificationQuestion } from '../api/questions'
import { parseCountParam } from '../api/questions'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Input } from '../components/ui/Input'
import { ErrorText } from '../components/ui/typography'
import {
  useAbandonProtection,
  useAttemptRun,
  useCompleteAttempt,
  useSubmitAttemptAnswer,
} from '../hooks/useAttempts'
import { useIdentificationQuestions } from '../hooks/useQuestions'

export function IdentificationPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const moduleId = Number(id)
  const count = parseCountParam(searchParams.get('count'))

  const { attempt, error } = useAttemptRun(moduleId, 'identification', count)

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
    event: SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const draft = (drafts[question.id] ?? "").trim();
    if (isComplete || answers[question.id] || draft === "") {
      return;
    }
    if (pendingQuestionId !== null) {
      return;
    }

    setActionError(null);
    setPendingQuestionId(question.id);

    try {
      const answer = await submitAnswer.mutateAsync({
        attemptId: attempt.id,
        questionId: question.id,
        userAnswer: draft,
      });
      setAnswers((current) => ({ ...current, [question.id]: answer }));
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "That answer could not be saved.",
      );
    } finally {
      setPendingQuestionId(null);
    }
  };

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
  draft,
  result,
  isComplete,
  isPending,
  onDraft,
  onCheck,
}: {
  question: IdentificationQuestion;
  position: number;
  draft: string;
  result: AttemptAnswer | undefined;
  isComplete: boolean;
  isPending: boolean;
  onDraft: (value: string) => void;
  onCheck: (
    question: IdentificationQuestion,
    event: SyntheticEvent<HTMLFormElement>,
  ) => void;
}) {
  const isLocked = isComplete || result !== undefined;

  return (
    <div className="card mb-3">
      <div className="card-body">
        <p className="mb-3">
          <span className="text-body-secondary me-2">{position + 1}.</span>
          {question.prompt}
        </p>

        <form
          onSubmit={(event) => onCheck(question, event)}
          className="d-flex flex-wrap align-items-start gap-2"
        >
          <Input
            aria-label={`Answer for question ${position + 1}`}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            disabled={isLocked}
            placeholder="Type the exact answer"
            className="flex-grow-1"
          />
          <Button
            type="submit"
            disabled={isLocked || isPending || draft.trim() === ""}
          >
            {isPending ? "Checking…" : `Check question ${position + 1}`}
          </Button>
        </form>

        {result ? (
          <p
            role="status"
            className={`mt-3 mb-0 small fw-semibold ${
              result.is_correct ? "text-success" : "text-danger"
            }`}
          >
            {result.is_correct ? "Correct" : "Incorrect"}
          </p>
        ) : null}

        {isComplete && !result ? (
          <p className="mt-3 mb-0 small text-body-secondary">Not answered</p>
        ) : null}
      </div>
    </div>
  );
}
