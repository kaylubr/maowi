import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Logo } from '../ui/Logo'
import { ProfileMenu } from './ProfileMenu'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  const confirmLogout = async () => {
    await logout.mutateAsync()
    setConfirmingLogout(false)
    navigate('/login', { replace: true })
  }

  return (
    <header data-bs-theme="dark" className="bg-dark text-white position-relative">
      <nav className="navbar app-navbar">
        <div className="container">
          <Link to="/dashboard" className="navbar-brand">
            <Logo />
          </Link>

          {user ? (
            <div className="d-flex align-items-center gap-3">
              <Link to="/dashboard" className="app-nav-link">
                Dashboard
              </Link>
              <ProfileMenu
                user={user}
                onLogout={() => setConfirmingLogout(true)}
              />
            </div>
          ) : null}
        </div>
      </nav>

      <ConfirmModal
        open={confirmingLogout}
        title="Log out"
        message="You will need to sign in again to study your modules."
        confirmLabel="Log out"
        busy={logout.isPending}
        onConfirm={confirmLogout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </header>
  )
}
