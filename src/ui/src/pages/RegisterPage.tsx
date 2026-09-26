import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { GlassCard } from '../components/ui/GlassCard'
import { useAuth } from '../hooks/useAuth'

const INPUT_CLASSES =
  'w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/50'

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <GlassCard className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold text-white">Create account</h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-white/80">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASSES}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-white/80">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={MINIMUM_PASSWORD_LENGTH}
              autoComplete="new-password"
              aria-describedby="password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASSES}
            />
            <p id="password-hint" className="mt-1 text-xs text-white/50">
              At least {MINIMUM_PASSWORD_LENGTH} characters.
            </p>
          </div>

          {register.isError ? (
            <p role="alert" className="text-sm text-red-300">
              {register.error.message}
            </p>
          ) : null}

          <Button type="submit" disabled={register.isPending} className="w-full">
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}
