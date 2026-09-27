export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'maowi-theme'

export function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

export function systemTheme(): Theme {
  if (typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(): Theme {
  return readStoredTheme() ?? systemTheme()
}

export function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    return
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.bsTheme = theme
}
