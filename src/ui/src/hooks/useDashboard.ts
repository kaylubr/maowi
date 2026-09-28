import { useQuery } from '@tanstack/react-query'

import { DASHBOARD_QUERY_KEY, fetchDashboardSummary } from '../api/dashboard'

export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardSummary,
    meta: { silent: true },
  })
}
