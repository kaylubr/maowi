import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { USERNAME_ERROR, isValidUsername, updateUsername } from '../../api/users'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Logo } from '../ui/Logo'
import { ErrorText, Label } from '../ui/typography'
import { AuthAlert } from './AuthAlert'

export function UsernamePrompt() {
  const { syncSession } = useAuth()
  const [username, setUsername] = useState('')

  const update = useMutation({
    mutationFn: updateUsername,
    onSuccess: (user) => syncSession(user),
  })

  const isValid = isValidUsername(username)
  const showInlineError = username.length > 0 && !isValid

  const submit = (event: FormEvent) => {
    event.preventDefault()

    if (!isValid) {
      return
    }

    update.mutate(username)
  }

  return (
    <main className="auth-page">
      <div className="container auth-page-body">
        <div className="card brand-card auth-card shadow-sm brand-fade">
          <div className="card-body p-4 p-sm-5">
            <div className="auth-lockup">
              <Logo />
            </div>

            <h1 className="h4 mb-2">Choose your username</h1>
            <p className="text-body-secondary small mb-4">
              Pick the name friends will see when you study together.
            </p>

            {update.isError ? <AuthAlert>{update.error.message}</AuthAlert> : null}

            <form onSubmit={submit}>
              <div className="mb-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
                {showInlineError ? <ErrorText>{USERNAME_ERROR}</ErrorText> : null}
              </div>

              <Button
                type="submit"
                disabled={update.isPending || !isValid}
                className="w-100"
              >
                {update.isPending ? 'Saving…' : 'Save'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
