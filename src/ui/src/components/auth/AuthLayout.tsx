import type { ReactNode } from 'react'

import { BackButton } from '../ui/BackButton'
import { Logo } from '../ui/Logo'

type AuthLayoutProps = {
  eyebrow: string
  children: ReactNode
}

export function AuthLayout({ eyebrow, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <div className="container auth-page-back">
        <BackButton />
      </div>

      <div className="container auth-page-body">
        <div className="card brand-card auth-card shadow-sm brand-fade">
          <div className="card-body p-4 p-sm-5">
            <div className="auth-lockup">
              <Logo />
              <p className="brand-eyebrow mb-0">{eyebrow}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
