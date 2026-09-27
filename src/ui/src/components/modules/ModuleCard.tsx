import type { ModuleStatus, StudyModule } from '../../api/modules'
import { Button } from '../ui/Button'

type ModuleCardProps = {
  module: StudyModule
  onGenerate?: (module: StudyModule) => void
  onStudy?: (module: StudyModule) => void
  onMerge?: (module: StudyModule) => void
}

const STATUS_LABELS: Record<ModuleStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  ready: 'Ready',
  failed: 'Failed',
}

const STATUS_BADGES: Record<ModuleStatus, string> = {
  draft: 'text-bg-secondary',
  generating: 'text-bg-warning',
  ready: 'text-bg-success',
  failed: 'text-bg-danger',
}

export function ModuleCard({
  module,
  onGenerate,
  onStudy,
  onMerge,
}: ModuleCardProps) {
  const isDraft = module.status === 'draft'
  const isReady = module.status === 'ready'

  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h3 className="card-title h5 mb-0">{module.name}</h3>
            <span className={`badge ${STATUS_BADGES[module.status]}`}>
              {STATUS_LABELS[module.status]}
            </span>
          </div>

          {module.status === 'failed' && module.error_message ? (
            <p role="alert" className="text-danger small mb-0">
              {module.error_message}
            </p>
          ) : null}
        </div>

        <div className="card-footer bg-transparent d-flex flex-wrap gap-2">
          {isDraft && onGenerate ? (
            <Button
              variant="secondary"
              aria-label={`Generate questions for ${module.name}`}
              onClick={() => onGenerate(module)}
            >
              Generate
            </Button>
          ) : null}
          {isReady && onStudy ? (
            <Button
              aria-label={`Study ${module.name}`}
              onClick={() => onStudy(module)}
            >
              Study
            </Button>
          ) : null}
          {onMerge ? (
            <Button
              variant="ghost"
              aria-label={`Merge ${module.name}`}
              onClick={() => onMerge(module)}
            >
              Merge
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
