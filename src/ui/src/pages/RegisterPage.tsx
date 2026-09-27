import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorText, Label } from '../components/ui/typography'
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
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="mb-4">
            <span className="fs-4 fw-semibold">Maowi</span>
          </div>

          <div className="card">
            <div className="card-body p-4">
              <h1 className="card-title h3 mb-4">Create account</h1>

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

                {register.isError ? (
                  <ErrorText>{register.error.message}</ErrorText>
                ) : null}

                <Button type="submit" disabled={register.isPending} className="w-100">
                  {register.isPending ? 'Creating account…' : 'Create account'}
                </Button>
              </form>

              <p className="mt-3 mb-0 small text-body-secondary">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
