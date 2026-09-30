import type { StudyModule } from './modules'
import { apiFetch } from './client'

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const

export type ModuleSummary = StudyModule & {
  is_owner: boolean
  question_count: number
  attempt_count: number
  best_score: number | null
  last_studied_at: string | null
}

export type DashboardSummary = {
  module_count: number
  question_count: number
  attempt_count: number
  average_score: number | null
  best_score: number | null
  last_studied_at: string | null
  modules: ModuleSummary[]
}

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/api/dashboard/summary')
}
