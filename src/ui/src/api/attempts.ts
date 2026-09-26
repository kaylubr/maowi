import { apiFetch } from './client'

export type AttemptMode = 'mcq' | 'identification'

export type Attempt = {
  id: number
  module_id: number
  mode: AttemptMode
  total_questions: number
  score: number | null
  started_at: string
  completed_at: string | null
}

export type AttemptAnswer = {
  question_id: number
  user_answer: string
  is_correct: boolean
}

export type AttemptDetail = Attempt & {
  answers: AttemptAnswer[]
}

export type StartAttemptPayload = {
  module_id: number
  mode: AttemptMode
  count?: number
}

export function startAttempt(payload: StartAttemptPayload): Promise<Attempt> {
  return apiFetch<Attempt>('/api/attempts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitAttemptAnswer(
  attemptId: number,
  payload: { question_id: number; user_answer: string },
): Promise<AttemptAnswer> {
  return apiFetch<AttemptAnswer>(`/api/attempts/${attemptId}/answers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function completeAttempt(attemptId: number): Promise<Attempt> {
  return apiFetch<Attempt>(`/api/attempts/${attemptId}/complete`, {
    method: 'POST',
  })
}

export function fetchAttempt(attemptId: number): Promise<AttemptDetail> {
  return apiFetch<AttemptDetail>(`/api/attempts/${attemptId}`)
}
