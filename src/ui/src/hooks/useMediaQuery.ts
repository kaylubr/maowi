import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window.matchMedia !== 'function') {
        return () => {}
      }

      const media = window.matchMedia(query)
      media.addEventListener('change', listener)

      return () => {
        media.removeEventListener('change', listener)
      }
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    if (typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
