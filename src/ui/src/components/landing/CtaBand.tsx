import { Link } from 'react-router-dom'

export function CtaBand() {
  return (
    <section className="landing-section pt-0">
      <div className="container">
        <div className="border landing-card p-4 p-lg-5 text-center">
          <h2 className="h1 fw-bold mb-2">Start with one lecture</h2>
          <p className="text-body-secondary mb-4">
            Add a file, get a question set, and find out whether it stuck.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create your first module
          </Link>
        </div>
      </div>
    </section>
  )
}
