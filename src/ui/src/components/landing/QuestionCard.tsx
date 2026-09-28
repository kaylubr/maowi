import type { KeyboardEvent } from 'react'
import { useRef, useState } from 'react'

const MODES = [
  { id: 'flashcard', name: 'Flashcard' },
  { id: 'mcq', name: 'Multiple Choice' },
  { id: 'identification', name: 'Identification' },
] as const

type ModeId = (typeof MODES)[number]['id']

export function QuestionCard() {
  const [mode, setMode] = useState<ModeId>('flashcard')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function selectByIndex(index: number) {
    setMode(MODES[index].id)
    tabRefs.current[index]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = MODES.findIndex((item) => item.id === mode)

    if (event.key === 'ArrowRight') {
      selectByIndex((index + 1) % MODES.length)
    } else if (event.key === 'ArrowLeft') {
      selectByIndex((index - 1 + MODES.length) % MODES.length)
    } else if (event.key === 'Home') {
      selectByIndex(0)
    } else if (event.key === 'End') {
      selectByIndex(MODES.length - 1)
    } else {
      return
    }

    event.preventDefault()
  }

  return (
    <div className="card landing-card shadow-sm" data-bs-theme="light">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="badge text-bg-warning">Sample</span>
          <span className="text-body-secondary small">Cell Biology</span>
        </div>

        <div
          role="tablist"
          aria-label="Study modes"
          className="nav nav-pills gap-1 mb-4"
          onKeyDown={handleKeyDown}
        >
          {MODES.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`mode-tab-${item.id}`}
              aria-selected={mode === item.id}
              aria-controls={`mode-panel-${item.id}`}
              tabIndex={mode === item.id ? 0 : -1}
              className={`nav-link ${mode === item.id ? 'active' : ''}`}
              onClick={() => setMode(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div
          key={mode}
          role="tabpanel"
          id={`mode-panel-${mode}`}
          aria-labelledby={`mode-tab-${mode}`}
          className="landing-fade"
        >
          <ModePanel mode={mode} />
        </div>
      </div>
    </div>
  )
}

function ModePanel({ mode }: { mode: ModeId }) {
  if (mode === 'mcq') {
    return <MultipleChoicePanel />
  }

  if (mode === 'identification') {
    return <IdentificationPanel />
  }

  return <FlashcardPanel />
}

function FlashcardPanel() {
  return (
    <div>
      <p className="fw-bold mb-3">
        What packages proteins and lipids before they leave the cell?
      </p>
      <div className="border-top pt-3">
        <p className="landing-eyebrow mb-1">Answer</p>
        <p className="mb-0">The Golgi apparatus</p>
      </div>
    </div>
  )
}

const MCQ_OPTIONS = ['Ribosome', 'Golgi apparatus', 'Lysosome', 'Peroxisome']

function MultipleChoicePanel() {
  return (
    <div>
      <p className="fw-bold mb-3">Which organelle packages proteins for shipping?</p>
      <ul className="list-unstyled d-flex flex-column gap-2 mb-3">
        {MCQ_OPTIONS.map((option) => (
          <li
            key={option}
            className="d-flex align-items-center gap-2 border rounded px-3 py-2"
          >
            <span className="landing-option-dot" aria-hidden="true" />
            <span>{option}</span>
            {option === 'Golgi apparatus' && (
              <span className="badge text-bg-success ms-auto">Correct</span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-body-secondary small mb-0">This run is scored.</p>
    </div>
  )
}

function IdentificationPanel() {
  return (
    <div>
      <p className="fw-bold mb-3">Which organelle modifies and packages proteins?</p>
      <div className="landing-answer mb-2">golgi apparatus</div>
      <p className="text-success small mb-0">
        Correct. Capitalisation and spacing were ignored.
      </p>
    </div>
  )
}
