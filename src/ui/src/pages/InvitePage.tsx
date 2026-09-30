import { useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { AuthAlert } from '../components/auth/AuthAlert'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useAcceptInvitation, useInvitation } from '../hooks/useMembers'

export function InvitePage() {
  const { token } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isUnauthenticated } = useAuth()
  const invitationQuery = useInvitation(token ?? '')
  const acceptInvitation = useAcceptInvitation()
  const [acceptError, setAcceptError] = useState<string | null>(null)

  if (invitationQuery.isPending) {
    return (
      <InviteShell>
        <p className="text-center text-body-secondary mb-0">
          Loading invitation…
        </p>
      </InviteShell>
    )
  }

  if (invitationQuery.isError) {
    return (
      <InviteShell>
        <p className="text-center text-body-secondary mb-0">
          This invitation link is no longer valid.
        </p>
      </InviteShell>
    )
  }

  if (isUnauthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAuthenticated) {
    return (
      <InviteShell>
        <p className="text-center text-body-secondary mb-0">
          Checking your session…
        </p>
      </InviteShell>
    )
  }

  const invitation = invitationQuery.data
  const ownerUsername = invitation.owner_username ?? 'the module owner'

  const accept = async () => {
    setAcceptError(null)

    try {
      const joined = await acceptInvitation.mutateAsync(token as string)
      navigate(`/modules/${joined.module_id}`, { replace: true })
    } catch (error) {
      setAcceptError(
        error instanceof Error
          ? error.message
          : 'That invitation could not be accepted.',
      )
    }
  }

  return (
    <InviteShell>
      <h1 className="h4 mb-2 text-center">
        {`Join ${invitation.module_name}`}
      </h1>
      <p className="text-body-secondary text-center mb-4">
        {`Invited by ${ownerUsername}`}
      </p>

      {acceptError ? <AuthAlert>{acceptError}</AuthAlert> : null}

      <Button
        onClick={accept}
        disabled={acceptInvitation.isPending}
        className="w-100"
      >
        {acceptInvitation.isPending ? 'Joining…' : 'Accept invitation'}
      </Button>
    </InviteShell>
  )
}

function InviteShell({ children }: { children: ReactNode }) {
  return <AuthLayout eyebrow="You're invited">{children}</AuthLayout>
}
