import type { ModuleStatus, StudyModule } from '../../api/modules'
import { Button } from '../ui/Button'
import { GlassCard } from '../ui/GlassCard'

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

const STATUS_CLASSES: Record<ModuleStatus, string> = {
  draft: 'bg-white/10 text-white/70',
  generating: 'bg-amber-400/20 text-amber-100',
  ready: 'bg-emerald-400/20 text-emerald-100',
  failed: 'bg-red-400/20 text-red-100',
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
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{module.name}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[module.status]}`}
        >
          {STATUS_LABELS[module.status]}
        </span>
      </div>

      {module.status === 'failed' && module.error_message ? (
        <p role="alert" className="text-xs text-red-200">
          {module.error_message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isDraft && onGenerate ? (
          <Button onClick={() => onGenerate(module)}>Generate</Button>
        ) : null}
        {isReady && onStudy ? (
          <Button onClick={() => onStudy(module)}>Study</Button>
        ) : null}
        {onMerge ? (
          <Button variant="ghost" onClick={() => onMerge(module)}>
            Merge
          </Button>
        ) : null}
      </div>
    </GlassCard>
  )
}
