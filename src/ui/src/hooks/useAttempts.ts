import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

import { useMutation } from '@tanstack/react-query'

import * as attemptsApi from '../api/attempts'
import type { Attempt, AttemptMode } from '../api/attempts'

export function useStartAttempt() {
  return useMutation({ mutationFn: attemptsApi.startAttempt })
}

export function useSubmitAttemptAnswer() {
  return useMutation({
    mutationFn: ({
      attemptId,
      questionId,
      userAnswer,
    }: {
      attemptId: number
      questionId: number
      userAnswer: string
    }) =>
      attemptsApi.submitAttemptAnswer(attemptId, {
        question_id: questionId,
        user_answer: userAnswer,
      }),
  })
}

export function useCompleteAttempt() {
  return useMutation({ mutationFn: attemptsApi.completeAttempt })
}

export function useAttemptRun(moduleId: number, mode: AttemptMode, count?: number) {
  const startAttempt = useStartAttempt()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const hasStarted = useRef(false)

  const moduleIsValid = Number.isInteger(moduleId) && moduleId > 0

  useEffect(() => {
    if (!moduleIsValid || hasStarted.current) {
      return
    }
    hasStarted.current = true

    startAttempt
      .mutateAsync({ module_id: moduleId, mode, count })
      .then(setAttempt)
      .catch((thrown: unknown) => {
        setStartError(
          thrown instanceof Error ? thrown.message : 'This quiz could not be started.',
        )
      })
  }, [moduleIsValid, moduleId, mode, count, startAttempt])

  return {
    attempt,
    error: moduleIsValid
      ? startError
      : 'This module could not be found.',
  }
}

export function useAbandonProtection(isActive: boolean) {
  const blocker = useBlocker(isActive)

  useEffect(() => {
    if (!isActive) {
      return
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isActive])

  return blocker
}
