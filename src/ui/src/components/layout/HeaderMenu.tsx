import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { useMediaQuery } from '../../hooks/useMediaQuery'

export const COMPACT_NAV_QUERY = '(max-width: 767.98px)'

type HeaderMenuProps = {
  children: ReactNode
  trailing?: ReactNode
  className?: string
  panelClassName?: string
}

export function HeaderMenu({ children, trailing, className, panelClassName }: HeaderMenuProps) {
  const isCompact = useMediaQuery(COMPACT_NAV_QUERY)

  if (!isCompact) {
    return (
      <div className="d-flex align-items-center gap-2">
        {children}
        {trailing}
      </div>
    )
  }

  return (
    <CompactHeaderMenu className={className} panelClassName={panelClassName} trailing={trailing}>
      {children}
    </CompactHeaderMenu>
  )
}

function CompactHeaderMenu({ children, trailing, className = '', panelClassName = '' }: HeaderMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return
      }
      setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="d-flex align-items-center gap-2 position-relative">
      {trailing}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={panelId}
        className={`btn border-0 p-1 lh-1 d-inline-flex align-items-center ${className}`}
      >
        <HamburgerIcon />
      </button>

      {open ? (
        <div
          id={panelId}
          className={`dropdown-menu show position-absolute top-100 end-0 mt-2 p-3 d-flex flex-column gap-2 header-menu-panel ${panelClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}
