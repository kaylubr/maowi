import type { ReactNode } from 'react'

type AuthAlertProps = {
  children: ReactNode
}

export function AuthAlert({ children }: AuthAlertProps) {
  return (
    <div role="alert" className="alert alert-danger py-2 small mb-3">
      {children}
    </div>
  )
}
