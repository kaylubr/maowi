const STEPS = [
  {
    title: 'Name it and add your files',
    body: 'Give the module a name and attach up to five files. PDF, DOCX and PPTX are supported.',
  },
  {
    title: 'Maowi writes the questions',
    body: 'The files are read on the server and turned into a set of questions with their answers. Your uploads are parsed in memory and then discarded.',
  },
  {
    title: 'Test yourself',
    body: 'Study the set as flashcards, multiple choice or identification. Multiple choice and identification runs are scored.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-section">
      <div className="container">
        <div className="row g-5">
          <div className="col-12 col-lg-4">
            <p className="landing-eyebrow mb-2">How it works</p>
            <h2 className="h1 fw-bold mb-2">Three steps, one upload</h2>
            <p className="text-body-secondary mb-0">
              There are no folders to organise and no question editor to fill in.
            </p>
          </div>

          <div className="col-12 col-lg-8">
            <ol className="list-unstyled d-flex flex-column gap-4 mb-0">
              {STEPS.map((step, index) => (
                <li key={step.title} className="d-flex gap-3">
                  <span className="landing-step" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="h5 mb-1">{step.title}</h3>
                    <p className="text-body-secondary mb-0">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
