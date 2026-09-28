import { Link } from 'react-router-dom'

import { Logo } from '../ui/Logo'

const SOURCE_URL = 'https://github.com/kaylubr/maowi'

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

          <div className="col-12 col-md-3">
            <h2 className="h6 text-uppercase text-body-secondary">Maowi</h2>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              <li>
                <Link
                  to="/privacy"
                  className="link-body-emphasis text-decoration-none"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="link-body-emphasis text-decoration-none"
                >
                  Terms of service
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="link-body-emphasis text-decoration-none"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href={SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-body-emphasis text-decoration-none"
                >
                  Source code
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-body-secondary small mt-5 mb-0">
          Uploads are never stored, and there is no payment anywhere in Maowi.
        </p>
        <p className="text-body-secondary small mt-2 mb-0">© 2026 Maowi</p>
      </div>
    </footer>
  )
}
