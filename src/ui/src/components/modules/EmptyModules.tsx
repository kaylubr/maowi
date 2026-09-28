import { Button } from '../ui/Button'

type EmptyModulesProps = {
  onAdd: () => void
}

const MODE_SUMMARY = [
  {
    name: 'Flashcard',
    description: 'Flip through your questions at your own pace. Not scored.',
  },
  {
    name: 'Multiple choice',
    description: 'Four options per question, marked as you go.',
  },
  {
    name: 'Identification',
    description: 'Type the answer from memory. Scored on exact wording.',
  },
]

export function EmptyModules({ onAdd }: EmptyModulesProps) {
  return (
    <div className="brand-card border bg-body-tertiary p-4 p-lg-5 text-center">
      <span className="brand-icon-badge mb-3">
        <LayersIcon />
      </span>

      <h2 className="h4 fw-bold mb-2">No modules yet</h2>
      <p
        className="text-body-secondary mx-auto mb-4"
        style={{ maxWidth: '32rem' }}
      >
        Add a module with your lecture files and Maowi writes a set of study
        questions from them, so you can test yourself instead of re-reading.
      </p>
      <Button onClick={onAdd}>Add your first module</Button>

      <div className="row g-3 text-start mt-4">
        {MODE_SUMMARY.map((mode) => (
          <div className="col-12 col-md-4" key={mode.name}>
            <div className="card h-100 brand-card brand-lift">
              <div className="card-body">
                <h3 className="h6 mb-1">{mode.name}</h3>
                <p className="text-body-secondary small mb-0">
                  {mode.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LayersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  )
}
