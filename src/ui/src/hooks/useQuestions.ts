import { useQuery } from '@tanstack/react-query'

import * as questionsApi from '../api/questions'
import type { QuestionMode } from '../api/questions'

export function questionQueryKey(
  moduleId: number,
  mode: QuestionMode,
  count?: number,
) {
  return ['modules', moduleId, 'questions', mode, count ?? 'all'] as const
}

export function useFlashcardQuestions(moduleId: number, count?: number) {
  return useQuery({
    queryKey: questionQueryKey(moduleId, 'flashcard', count),
    queryFn: () => questionsApi.listFlashcardQuestions(moduleId, count),
  })
}

export function useMultipleChoiceQuestions(moduleId: number, count?: number) {
  return useQuery({
    queryKey: questionQueryKey(moduleId, 'mcq', count),
    queryFn: () => questionsApi.listMultipleChoiceQuestions(moduleId, count),
  })
}

export function useIdentificationQuestions(moduleId: number, count?: number) {
  return useQuery({
    queryKey: questionQueryKey(moduleId, 'identification', count),
    queryFn: () => questionsApi.listIdentificationQuestions(moduleId, count),
  })
}
