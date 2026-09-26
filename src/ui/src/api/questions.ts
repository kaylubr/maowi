import { apiFetch } from './client'

export type QuestionMode = 'flashcard' | 'mcq' | 'identification'

export type FlashcardQuestion = {
  id: number
  prompt: string
  answer: string
}

export type MultipleChoiceQuestion = {
  id: number
  prompt: string
  options: string[]
}

export type IdentificationQuestion = {
  id: number
  prompt: string
}

function requestQuestions<T>(
  moduleId: number,
  mode: QuestionMode,
  count?: number,
): Promise<T[]> {
  const params = new URLSearchParams({ mode })
  if (count !== undefined) {
    params.set('count', String(count))
  }
  return apiFetch<T[]>(`/api/modules/${moduleId}/questions?${params}`)
}

export function listFlashcardQuestions(
  moduleId: number,
  count?: number,
): Promise<FlashcardQuestion[]> {
  return requestQuestions<FlashcardQuestion>(moduleId, 'flashcard', count)
}

export function listMultipleChoiceQuestions(
  moduleId: number,
  count?: number,
): Promise<MultipleChoiceQuestion[]> {
  return requestQuestions<MultipleChoiceQuestion>(moduleId, 'mcq', count)
}

export function listIdentificationQuestions(
  moduleId: number,
  count?: number,
): Promise<IdentificationQuestion[]> {
  return requestQuestions<IdentificationQuestion>(moduleId, 'identification', count)
}
