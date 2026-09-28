import type { StudyModule } from '../../api/modules'
import { Button } from '../ui/Button'

type ModuleCardProps = {
  module: StudyModule
  onStudy?: (module: StudyModule) => void
  onDelete?: (module: StudyModule) => void
}

export function ModuleCard({ module, onStudy, onDelete }: ModuleCardProps) {
  return (
    <div className="col">
      <div className="card h-100 brand-card brand-lift">
        <div className="card-body">
          <h3 className="card-title h5 mb-0">{module.name}</h3>
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
          {onDelete ? (
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
