import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { GlassCard } from '../components/ui/GlassCard'
import { useAuth } from '../hooks/useAuth'

const INPUT_CLASSES =
  'w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/50'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <GlassCard className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold text-white">Log in</h1>

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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASSES}
            />
          </div>

          {login.isError ? (
            <p role="alert" className="text-sm text-red-300">
              {login.error.message}
            </p>
          ) : null}

          <Button type="submit" disabled={login.isPending} className="w-full">
            {login.isPending ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          No account yet?{' '}
          <Link to="/register" className="underline">
            Create one
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}
