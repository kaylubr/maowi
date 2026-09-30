import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  USERNAME_ERROR,
  USERNAME_MAX,
  USERNAME_MIN,
  isValidUsername,
} from '../api/users'
import { AuthAlert } from '../components/auth/AuthAlert'
import { AuthDivider } from '../components/auth/AuthDivider'
import { AuthLayout } from '../components/auth/AuthLayout'
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorText, Label } from '../components/ui/typography'
import { useAuth } from '../hooks/useAuth'
import { useRedirectTarget } from '../hooks/useRedirectTarget'

const MINIMUM_PASSWORD_LENGTH = 8

export function RegisterPage() {
  const redirectTo = useRedirectTarget()
  const { register, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    register.mutate({ email, username, password })
  }

  return (
    <AuthLayout eyebrow="Get started">
      <GoogleSignInButton />
      <AuthDivider />

      {register.isError ? <AuthAlert>{register.error.message}</AuthAlert> : null}

      <form onSubmit={submit}>
        <div className="mb-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            required
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          {username.length > 0 && !isValidUsername(username) ? (
            <ErrorText>{USERNAME_ERROR}</ErrorText>
          ) : null}
        </div>

        <div className="mb-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={MINIMUM_PASSWORD_LENGTH}
            autoComplete="new-password"
            aria-describedby="password-hint"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div id="password-hint" className="form-text">
            At least {MINIMUM_PASSWORD_LENGTH} characters.
          </div>
        </div>

        <Button type="submit" disabled={register.isPending} className="w-100">
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-3 mb-0 small text-body-secondary">
        By creating an account you agree to our{' '}
        <Link to="/terms">Terms of service</Link> and{' '}
        <Link to="/privacy">Privacy policy</Link>.
      </p>

      <p className="mt-2 mb-0 small text-body-secondary">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}
