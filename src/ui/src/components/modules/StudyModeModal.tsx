import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { ModuleSummary } from '../../api/dashboard'
import type { QuestionMode } from '../../api/questions'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Label } from '../ui/typography'

type StudyModeModalProps = {
  module: ModuleSummary | null
  onClose: () => void
}

const MODES: { value: QuestionMode; label: string; description: string }[] = [
  {
    value: 'flashcard',
    label: 'Flashcard',
    description: 'Flip each card at your own pace. Nothing is scored.',
  },
  {
    value: 'mcq',
    label: 'Multiple choice',
    description: 'Four options per question, marked as you go.',
  },
  {
    value: 'identification',
    label: 'Identification',
    description: 'Type the answer from memory. Scored on exact wording.',
  },
]

export function StudyModeModal({ module, onClose }: StudyModeModalProps) {
  if (module === null) {
    return null
  }

  return <StudyModeDialog key={module.id} module={module} onClose={onClose} />
}

function StudyModeDialog({
  module,
  onClose,
}: {
  module: ModuleSummary
  onClose: () => void
}) {
  const navigate = useNavigate()
  const total = module.question_count
  const hasQuestions = total > 0
  const [mode, setMode] = useState<QuestionMode>('flashcard')
  const [countInput, setCountInput] = useState(hasQuestions ? String(total) : '')

  const count = clampCount(Number(countInput), total)

  const start = () => {
    navigate(`/modules/${module.id}/${mode}?count=${count}`)
  }

  return (
    <Modal open title={`Study ${module.name}`} onClose={onClose}>
      <fieldset className="mb-3">
        <legend className="form-label">Study mode</legend>
        {MODES.map((option) => (
          <div key={option.value} className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="study-mode"
              id={`study-mode-${option.value}`}
              value={option.value}
              checked={mode === option.value}
              onChange={() => setMode(option.value)}
            />
            <label
              className="form-check-label"
              htmlFor={`study-mode-${option.value}`}
            >
              <span className="d-block">{option.label}</span>
              <span className="d-block small text-body-secondary">
                {option.description}
              </span>
            </label>
          </div>
        ))}
      </fieldset>

      <div className="mb-3">
        <Label htmlFor="question-count">Number of questions</Label>
        <Input
          id="question-count"
          type="number"
          min={1}
          max={hasQuestions ? total : 1}
          value={countInput}
          onChange={(event) => setCountInput(event.target.value)}
          onBlur={() => setCountInput(String(count))}
          disabled={!hasQuestions}
          style={{ maxWidth: '8rem' }}
        />
        <div className="form-text">
          {hasQuestions
            ? `This module has ${total} question${total === 1 ? '' : 's'}.`
            : 'This module has no questions yet.'}
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={start} disabled={!hasQuestions}>
          Start studying
        </Button>
      </div>
    </Modal>
  )
}

function clampCount(value: number, total: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return Math.max(total, 1)
  }
  return Math.min(Math.trunc(value), Math.max(total, 1))
}
