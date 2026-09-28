import { Link } from 'react-router-dom'

import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'

export function LandingHeader() {
  return (
    <header className="border-bottom border-secondary-subtle">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
        <Logo />

        <nav className="d-flex align-items-center gap-2">
          <Link to="/login" className="btn btn-link text-decoration-none">
            Log in
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Get started
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
