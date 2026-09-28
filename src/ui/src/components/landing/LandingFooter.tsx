import { Link } from 'react-router-dom'

import { Logo } from '../ui/Logo'

const PAGE_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Study modes', href: '#study-modes' },
  { label: 'Your dashboard', href: '#dashboard' },
  { label: 'What it does not do', href: '#limits' },
]

export function LandingFooter() {
  return (
    <footer className="landing-section pb-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <Logo />
            <p className="text-body-secondary landing-footer-note mt-3 mb-0">
              Maowi turns your lecture files into questions you can practise, so
              revision starts from what you were already given.
            </p>
          </div>

          <div className="col-6 col-md-3">
            <h2 className="h6 text-uppercase text-body-secondary">On this page</h2>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="link-body-emphasis text-decoration-none"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-3">
            <h2 className="h6 text-uppercase text-body-secondary">Your account</h2>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/register" className="link-body-emphasis text-decoration-none">
                  Create an account
                </Link>
              </li>
              <li>
                <Link to="/login" className="link-body-emphasis text-decoration-none">
                  Log in to your account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-body-secondary small mt-5 mb-0">
          Uploads are never stored, and there is no payment anywhere in Maowi.
        </p>
      </div>
    </footer>
  )
}
