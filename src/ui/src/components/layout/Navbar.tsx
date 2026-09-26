import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { ConfirmModal } from '../ui/ConfirmModal'

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
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
        <Link to="/dashboard" className="text-lg font-semibold text-white">
          Maowi
        </Link>

        <div className="flex items-center gap-4">
          {user ? <span className="text-sm text-white/70">{user.email}</span> : null}
          <Button variant="ghost" onClick={() => setConfirmingLogout(true)}>
            Log out
          </Button>
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
