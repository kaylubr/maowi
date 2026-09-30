import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { HeaderMenu } from './HeaderMenu'

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
    <header data-bs-theme="dark" className="bg-dark text-white position-relative">
      <nav className="navbar">
        <div className="container">
          <Link to="/dashboard" className="navbar-brand">
            <Logo />
          </Link>

          <HeaderMenu
            className="text-white"
            panelClassName="bg-dark border-secondary-subtle"
            trailing={isDashboard ? <ThemeToggle /> : null}
          >
            {user ? (
              <Link
                to="/profile"
                className="d-inline-flex align-items-center gap-2 text-decoration-none text-white"
              >
                <Avatar
                  userId={user.id}
                  username={user.username}
                  avatarUrl={user.avatar_url}
                  size="sm"
                />
                <span>{user.username ?? user.email}</span>
              </Link>
            ) : null}
            <Button variant="ghost" onClick={() => setConfirmingLogout(true)}>
              Log out
            </Button>
          </HeaderMenu>
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
