import { useIsFetching, useIsMutating } from '@tanstack/react-query'

import { useDelayedLoading } from '../../hooks/useDelayedLoading'

export function LoadingOverlay() {
  const activeFetches = useIsFetching()
  const activeMutations = useIsMutating()

  const pending = activeFetches > 0 || activeMutations > 0
  const visible = useDelayedLoading(pending, 300)

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        role="status"
        aria-label="Loading"
        className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"
      />
    </div>
  )
}
