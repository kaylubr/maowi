import { Link } from 'react-router-dom'

import { HeaderMenu } from '../layout/HeaderMenu'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'

export function LandingHeader() {
  return (
    <header className="border-bottom border-secondary-subtle position-relative">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
        <Logo />

        <HeaderMenu
          panelClassName="bg-body border-secondary-subtle"
          trailing={<ThemeToggle />}
        >
          <Link to="/login" className="btn btn-link text-decoration-none">
            Log in
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Get started
          </Link>
        </HeaderMenu>
      </div>
    </header>
  )
}
