import { useState } from 'react'

import { CreateModuleModal } from '../components/modules/CreateModuleModal'
import { ModuleCard } from '../components/modules/ModuleCard'
import { UploadFilesModal } from '../components/modules/UploadFilesModal'
import { Button } from '../components/ui/Button'
import { GlassCard } from '../components/ui/GlassCard'
import { useFiles } from '../hooks/useFiles'
import { useModules } from '../hooks/useModules'

export function DashboardPage() {
  const modulesQuery = useModules()
  const filesQuery = useFiles()

  const [showUpload, setShowUpload] = useState(false)
  const [showCreateModule, setShowCreateModule] = useState(false)

  const modules = modulesQuery.data ?? []
  const files = filesQuery.data ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Your modules</h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowCreateModule(true)}>
            New module
          </Button>
          <Button onClick={() => setShowUpload(true)}>Upload files</Button>
        </div>
      </div>

      {modulesQuery.isPending ? (
        <p className="text-white/60">Loading your modules…</p>
      ) : null}

      {modulesQuery.isError ? (
        <p role="alert" className="text-red-300">
          {modulesQuery.error.message}
        </p>
      ) : null}

      {modulesQuery.isSuccess && modules.length === 0 ? (
        <GlassCard>
          <p className="text-white/70">
            No modules yet. Upload your lecture files and they will be grouped by
            topic automatically, or create a module by hand.
          </p>
        </GlassCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Your files</h2>

        {filesQuery.isSuccess && files.length === 0 ? (
          <GlassCard>
            <p className="text-white/70">
              Nothing uploaded yet. PDF, DOCX and PPTX are supported.
            </p>
          </GlassCard>
        ) : null}

        {files.length > 0 ? (
          <GlassCard className="p-0">
            <ul className="divide-y divide-white/10">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <span className="text-sm text-white">{file.filename}</span>
                  <span className="text-xs text-white/60">{file.status}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        ) : null}
      </section>

      <UploadFilesModal open={showUpload} onClose={() => setShowUpload(false)} />
      <CreateModuleModal
        open={showCreateModule}
        onClose={() => setShowCreateModule(false)}
      />
    </div>
  )
}
