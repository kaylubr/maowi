import { Fragment, useId } from 'react'

import { useTheme } from '../../hooks/useTheme'
import type { ThemePreference } from '../../theme'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeChoice() {
  const { preference, setPreference } = useTheme()
  const groupId = useId()

  return (
    <div className="btn-group" role="group" aria-label="Theme">
      {OPTIONS.map((option) => {
        const inputId = `${groupId}-${option.value}`
        return (
          <Fragment key={option.value}>
            <input
              type="radio"
              className="btn-check"
              name={groupId}
              id={inputId}
              autoComplete="off"
              checked={preference === option.value}
              onChange={() => setPreference(option.value)}
            />
            <label className="btn btn-outline-secondary" htmlFor={inputId}>
              {option.label}
            </label>
          </Fragment>
        )
      })}
    </div>
  )
}
