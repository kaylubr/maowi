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
      <div>
        <Navbar />
        <main className="container py-4">
          <Outlet />
        </main>
      </div>
    )
  }

  if (isResolvingSession) {
    return (
      <p className="container py-5 text-center text-body-secondary">
        Checking your session…
      </p>
    )
  }

  if (hasUnexpectedError) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 text-center">
            <p className="mb-3 text-body-secondary">
              We could not reach the server
              {sessionError instanceof Error ? `: ${sessionError.message}` : ''}.
            </p>
            <Button onClick={() => void refetchSession()}>Try again</Button>
          </div>
        </div>
      </div>
    )
  }

  return <Navigate to="/login" replace />
}
