const MODES = [
  {
    name: 'Flashcard',
    description:
      'Read the question, guess, then check yourself. Nothing is scored, so there is no wrong answer to worry about.',
  },
  {
    name: 'Multiple Choice',
    description:
      'Four options, one of them correct. Maowi tells you straight away and the run is scored.',
  },
  {
    name: 'Identification',
    description:
      'Type the answer from memory. Capitalisation and spacing are forgiven, the wording is not. The run is scored.',
  },
]

export function StudyModes() {
  return (
    <section id="study-modes" className="landing-section bg-body-tertiary">
      <div className="container">
        <p className="landing-eyebrow mb-2">Study modes</p>
        <h2 className="h1 fw-bold mb-4">One question pool, three ways to use it</h2>

        <div className="row g-4">
          {MODES.map((mode) => (
            <div key={mode.name} className="col-12 col-md-4">
              <div className="card h-100 landing-card landing-lift">
                <div className="card-body">
                  <h3 className="card-title h5">{mode.name}</h3>
                  <p className="card-text text-body-secondary mb-0">
                    {mode.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
