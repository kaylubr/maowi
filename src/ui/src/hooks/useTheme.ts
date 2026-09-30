import { useCallback, useEffect, useSyncExternalStore } from 'react'

import type { Theme, ThemePreference } from '../theme'
import {
  applyTheme,
  clearStoredTheme,
  readStoredPreference,
  readStoredTheme,
  systemTheme,
  writeStoredTheme,
} from '../theme'

type ThemeSnapshot = {
  preference: ThemePreference
  theme: Theme
}

const listeners = new Set<() => void>()
let currentPreference: ThemePreference | null = null
let snapshot: ThemeSnapshot | null = null

function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'system' ? systemTheme() : preference
}

function getSnapshot(): ThemeSnapshot {
  if (snapshot === null) {
    const preference = currentPreference ?? readStoredPreference()
    snapshot = { preference, theme: resolveTheme(preference) }
  }
  return snapshot
}

function getServerSnapshot(): ThemeSnapshot {
  return { preference: 'system', theme: 'light' }
}

function emit(): void {
  snapshot = null
  for (const listener of listeners) {
    listener()
  }
}

function setPreference(next: ThemePreference): void {
  currentPreference = next

  if (next === 'system') {
    clearStoredTheme()
  } else {
    writeStoredTheme(next)
  }

  applyTheme(resolveTheme(next))
  emit()
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
    applyTheme(systemTheme())
    emit()
  }

  media?.addEventListener('change', followSystem)

  return () => {
    listeners.delete(listener)
    media?.removeEventListener('change', followSystem)
  }
}

export function useTheme() {
  const { preference, theme } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setPreference(getSnapshot().theme === 'dark' ? 'light' : 'dark')
  }, [])

  return { theme, preference, setPreference, toggleTheme }
}
