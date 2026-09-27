import { useCallback, useEffect, useSyncExternalStore } from 'react'

import type { Theme } from '../theme'
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  systemTheme,
  writeStoredTheme,
} from '../theme'

const listeners = new Set<() => void>()
let current: Theme | null = null

function getSnapshot(): Theme {
  if (current === null) {
    current = resolveTheme()
  }
  return current
}

function getServerSnapshot(): Theme {
  return 'light'
}

function setTheme(next: Theme): void {
  current = next
  applyTheme(next)
  writeStoredTheme(next)
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  const media =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null

  const followSystem = () => {
    if (readStoredTheme() !== null) {
      return
    }
    setTheme(systemTheme())
  }

  media?.addEventListener('change', followSystem)

  return () => {
    listeners.delete(listener)
    media?.removeEventListener('change', followSystem)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(getSnapshot() === 'dark' ? 'light' : 'dark')
  }, [])

  return { theme, setTheme, toggleTheme }
}
