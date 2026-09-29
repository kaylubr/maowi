import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { AuthAlert } from '../components/auth/AuthAlert'
import { AuthDivider } from '../components/auth/AuthDivider'
import { AuthLayout } from '../components/auth/AuthLayout'
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/typography'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <AuthLayout eyebrow="Welcome back">
      <GoogleSignInButton />
      <AuthDivider />

      {login.isError ? <AuthAlert>{login.error.message}</AuthAlert> : null}

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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <Button type="submit" disabled={login.isPending} className="w-100">
          {login.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-3 mb-0 small text-body-secondary">
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </AuthLayout>
  )
}
