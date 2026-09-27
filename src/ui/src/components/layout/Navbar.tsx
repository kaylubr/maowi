import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { ConfirmModal } from '../ui/ConfirmModal'
import { ThemeToggle } from '../ui/ThemeToggle'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard'
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  const confirmLogout = async () => {
    await logout.mutateAsync()
    setConfirmingLogout(false)
    navigate('/login', { replace: true })
  }

  return (
    <header data-bs-theme="dark" className="bg-dark text-white">
      <nav className="navbar border-bottom">
        <div className="container">
          <Link to="/dashboard" className="navbar-brand">
            Maowi
          </Link>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <span className="text-body-secondary small d-none d-sm-inline">
                {user.email}
              </span>
            ) : null}
            <Button variant="ghost" onClick={() => setConfirmingLogout(true)}>
              Log out
            </Button>
            {isDashboard ? <ThemeToggle /> : null}
          </div>
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
