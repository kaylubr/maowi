const LIMITS = [
  {
    title: 'It does not store your files',
    body: 'Uploads are parsed in memory while the module is created and then thrown away. Nothing is kept on the server.',
  },
  {
    title: 'It does not take everything',
    body: 'PDF, DOCX and PPTX only, and no more than five files in a single module.',
  },
  {
    title: 'It does not promise perfect questions',
    body: 'The set is written by an AI model and can be wrong. Answer checking happens on the server, not in your browser.',
  },
  {
    title: 'It does not schedule your revision',
    body: 'There is no spaced repetition, no reminders and no calendar. You decide when to sit down and study.',
  },
]

export function Limits() {
  return (
    <section id="limits" className="landing-section">
      <div className="container">
        <p className="landing-eyebrow mb-2">Straight answers</p>
        <h2 className="h1 fw-bold mb-4">What Maowi does not do</h2>

        <div className="row g-4">
          {LIMITS.map((limit) => (
            <div key={limit.title} className="col-12 col-md-6">
              <h3 className="h5 mb-1">{limit.title}</h3>
              <p className="text-body-secondary mb-0">{limit.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
