import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { AuthAlert } from '../components/auth/AuthAlert'
import { AuthDivider } from '../components/auth/AuthDivider'
import { AuthLayout } from '../components/auth/AuthLayout'
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/typography'
import { useAuth } from '../hooks/useAuth'

const MINIMUM_PASSWORD_LENGTH = 8

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    register.mutate({ email, password })
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
