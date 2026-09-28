import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { BackButton } from '../components/ui/BackButton'
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
    <main className="container min-vh-100 d-flex flex-column justify-content-center py-5">
      <div className="position-fixed top-0 start-0 m-3">
        <BackButton />
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
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
