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
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-body bg-opacity-75"
      style={{ zIndex: 1090 }}
    >
      <div className="spinner-border" role="status" aria-label="Loading" />
    </div>
  )
}
