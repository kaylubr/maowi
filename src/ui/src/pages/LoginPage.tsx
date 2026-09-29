import { useState } from 'react'
import type { SyntheticEvent } from "react";
import { Link, Navigate } from 'react-router-dom'

import { GoogleSignInButton } from '../components/auth/GoogleSignInButton'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorText, Label } from '../components/ui/typography'
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
    <main className="container min-vh-100 d-flex flex-column justify-content-center py-5">
      <div className="position-fixed top-0 start-0 m-3">
        <BackButton />
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card">
            <div className="card-body p-4">
              <h1 className="card-title h3 mb-4">Log in</h1>

              <GoogleSignInButton />

              <div className="d-flex align-items-center gap-2 my-3">
                <hr className="flex-grow-1 my-0" />
                <span className="text-body-secondary small">or</span>
                <hr className="flex-grow-1 my-0" />
              </div>

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

                {login.isError ? <ErrorText>{login.error.message}</ErrorText> : null}

                <Button type="submit" disabled={login.isPending} className="w-100">
                  {login.isPending ? 'Logging in…' : 'Log in'}
                </Button>
              </form>

              <p className="mt-3 mb-0 small text-body-secondary">
                No account yet? <Link to="/register">Create one</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
