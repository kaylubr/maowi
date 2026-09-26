import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { StudyModule } from '../../api/modules'
import type { QuestionMode } from '../../api/questions'
import { useModuleQuestionCount } from '../../hooks/useQuestions'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

type StudyModeModalProps = {
  module: StudyModule | null
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

const INPUT_CLASSES =
  'w-24 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:border-white/50'

export function StudyModeModal({ module, onClose }: StudyModeModalProps) {
  if (module === null) {
    return null
  }

  return <StudyModeDialog module={module} onClose={onClose} />
}

function StudyModeDialog({
  module,
  onClose,
}: {
  module: StudyModule
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { total, isPending, isError, error } = useModuleQuestionCount(module.id)
  const [mode, setMode] = useState<QuestionMode>('flashcard')
  const [countInput, setCountInput] = useState('')
  const [seededTotal, setSeededTotal] = useState(-1)

  const hasQuestions = total > 0

  if (total > 0 && seededTotal !== total) {
    setSeededTotal(total)
    setCountInput(String(total))
  }

  const count = clampCount(Number(countInput), total)

  const start = () => {
    navigate(`/modules/${module.id}/${mode}?count=${count}`)
  }

  return (
    <Modal open title={`Study ${module.name}`} onClose={onClose}>
      <div className="space-y-5">
        {isPending ? <p className="text-sm text-white/60">Loading questions…</p> : null}

        {isError ? (
          <p role="alert" className="text-sm text-red-300">
            {error instanceof Error ? error.message : 'Could not load questions.'}
          </p>
        ) : null}

        {!isPending && !isError ? (
          <>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm text-white/80">Study mode</legend>
              {MODES.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/5"
                >
                  <input
                    type="radio"
                    name="study-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm text-white">{option.label}</span>
                    <span className="block text-xs text-white/60">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div>
              <label htmlFor="question-count" className="mb-1 block text-sm text-white/80">
                Number of questions
              </label>
              <input
                id="question-count"
                type="number"
                min={1}
                max={hasQuestions ? total : 1}
                value={countInput}
                onChange={(event) => setCountInput(event.target.value)}
                onBlur={() => setCountInput(String(count))}
                disabled={!hasQuestions}
                className={INPUT_CLASSES}
              />
              <span className="mt-1 block text-xs text-white/50">
                {hasQuestions
                  ? `This module has ${total} question${total === 1 ? '' : 's'}.`
                  : 'This module has no questions yet.'}
              </span>
            </div>
          </>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={start} disabled={!hasQuestions || isPending || isError}>
            Start studying
          </Button>
        </div>
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
