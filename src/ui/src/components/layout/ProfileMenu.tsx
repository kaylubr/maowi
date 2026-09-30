import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import type { User } from '../../api/auth'
import { useDismissable } from '../../hooks/useDismissable'
import { Avatar } from '../ui/Avatar'

type ProfileMenuProps = {
  user: User
  onLogout: () => void
}

export function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const close = useCallback(() => setOpen(false), [])
  useDismissable(open, containerRef, close)

  return (
    <div ref={containerRef} className="position-relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Account menu"
        className="btn border-0 p-1 lh-1 d-inline-flex align-items-center text-white"
      >
        <Avatar
          userId={user.id}
          username={user.username}
          avatarUrl={user.avatar_url}
          size="sm"
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="dropdown-menu dropdown-menu-end show position-absolute top-100 end-0 mt-2 p-2 header-menu-panel profile-menu-panel"
        >
          <Link to="/profile" className="dropdown-item" onClick={close}>
            Profile
          </Link>
          <Link to="/settings" className="dropdown-item" onClick={close}>
            Settings
          </Link>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              close()
              onLogout()
            }}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
