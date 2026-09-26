import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Navbar } from './Navbar'

export function ProtectedRoute() {
  const {
    isAuthenticated,
    isUnauthenticated,
    isResolvingSession,
    sessionError,
    refetchSession,
  } = useAuth()

  const hasUnexpectedError = sessionError != null && !isUnauthenticated

  if (isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    )
  }

  if (isResolvingSession) {
    return <p className="p-10 text-center text-white/70">Checking your session…</p>
  }

  if (hasUnexpectedError) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="mb-4 text-white/80">
          We could not reach the server
          {sessionError instanceof Error ? `: ${sessionError.message}` : ''}.
        </p>
        <Button onClick={() => void refetchSession()}>Try again</Button>
      </div>
    )
  }

  return <Navigate to="/login" replace />
}
