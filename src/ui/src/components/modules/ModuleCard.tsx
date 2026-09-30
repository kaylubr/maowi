import { Link } from 'react-router-dom'

import type { ModuleSummary } from '../../api/dashboard'
import { Button } from '../ui/Button'

type ModuleCardProps = {
  module: ModuleSummary
  onStudy?: (module: ModuleSummary) => void
  onDelete?: (module: ModuleSummary) => void
}

export function ModuleCard({ module, onStudy, onDelete }: ModuleCardProps) {
  return (
    <div className="col">
      <div className="card h-100 brand-card brand-lift">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div>
              <h3 className="card-title h5 mb-0">
                <Link
                  to={`/modules/${module.id}`}
                  className="text-decoration-none"
                >
                  {module.name}
                </Link>
              </h3>
              <span className="badge text-bg-secondary mt-2">
                {module.is_owner ? 'Owner' : 'Member'}
              </span>
            </div>
            <span className="brand-chip text-nowrap">
              {module.question_count}{' '}
              {module.question_count === 1 ? 'question' : 'questions'}
            </span>
          </div>

          <p className="text-body-secondary small mt-3 mb-0">
            {studySummary(module)}
          </p>
        </div>

        <div className="card-footer bg-transparent d-flex flex-wrap gap-2">
          {onStudy ? (
            <Button
              aria-label={`Study ${module.name}`}
              onClick={() => onStudy(module)}
            >
              Study
            </Button>
          ) : null}
          {onDelete && module.is_owner ? (
            <Button
              variant="ghost"
              aria-label={`Delete ${module.name}`}
              onClick={() => onDelete(module)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function studySummary(module: ModuleSummary): string {
  if (module.attempt_count === 0) {
    return 'Not studied yet'
  }

  return `Best ${module.best_score}% · studied ${formatRelativeTime(module.last_studied_at)}`
}

function formatRelativeTime(iso: string | null): string {
  if (iso === null) {
    return 'recently'
  }

  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)

  if (minutes < 1) {
    return 'just now'
  }
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }

  const weeks = Math.floor(days / 7)
  if (weeks < 5) {
    return `${weeks}w ago`
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months}mo ago`
  }

  return `${Math.floor(days / 365)}y ago`
}
