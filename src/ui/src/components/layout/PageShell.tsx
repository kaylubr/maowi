import type { ReactNode } from 'react'

import { BackButton } from '../ui/BackButton'

type PageShellProps = {
  title: string
  children: ReactNode
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <main className="container min-vh-100 py-5">
      <BackButton />

      <div className="row justify-content-center mt-4">
        <div className="col-12 col-lg-8 col-xl-7">
          <h1 className="h2 mb-4">{title}</h1>
          <div className="d-flex flex-column gap-3">{children}</div>
        </div>
      </div>
    </main>
  )
}
