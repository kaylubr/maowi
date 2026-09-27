import { Link } from 'react-router-dom'

import { ThemeToggle } from '../components/ui/ThemeToggle'

const STUDY_MODES = [
  {
    name: 'Flashcard',
    description:
      'Flip through your material at your own pace. No scoring, no pressure — just recall.',
  },
  {
    name: 'Multiple Choice',
    description:
      'Pick from four options and find out straight away whether you got it right.',
  },
  {
    name: 'Identification',
    description:
      'Type the exact answer from memory. Case and spacing are forgiving; the wording is not.',
  },
]

export function LandingPage() {
  return (
    <div>
      <header data-bs-theme="dark" className="bg-dark text-white border-bottom">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
          <span className="fs-4 fw-semibold">Maowi</span>

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

      <main className="container pb-5">
        <div className="row py-5">
          <div className="col-12 col-lg-8">
            <h1 className="display-5 fw-bold">
              Turn your lecture notes into a study set
            </h1>
            <p className="lead text-body-secondary">
              Upload your PDFs, slides and handouts. Maowi groups them into topics
              and writes the questions, so you can spend your time recalling
              instead of re-reading.
            </p>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create a free account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                I already have one
              </Link>
            </div>
          </div>
        </div>

        <div className="row row-cols-1 row-cols-md-3 g-4">
          {STUDY_MODES.map((mode) => (
            <div key={mode.name} className="col">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="card-title h5">{mode.name}</h2>
                  <p className="card-text text-body-secondary mb-0">
                    {mode.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
