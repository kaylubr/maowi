import { Link } from 'react-router-dom'

import { QuestionCard } from './QuestionCard'

export function Hero() {
  return (
    <section className="landing-hero">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-12 col-lg-6">
            <h1 className="display-5 fw-bold">
              Turn your lecture notes into a study set
            </h1>
            <p className="lead text-body-secondary">
              Add up to five PDFs, slides or handouts and Maowi writes a set of
              questions from them, so you can test yourself instead of re-reading.
            </p>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create a free account
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">
                I already have one
              </Link>
            </div>

            <p className="text-body-secondary small mt-3 mb-0">
              Uploads are parsed in memory and never stored.
            </p>
          </div>

          <div className="col-12 col-lg-6">
            <QuestionCard />
          </div>
        </div>
      </div>
    </section>
  )
}
