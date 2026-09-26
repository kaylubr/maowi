import { Link } from 'react-router-dom'

import { GlassCard } from '../components/ui/GlassCard'

const STUDY_MODES = [
  {
    name: 'Flashcard',
    description:
      'Flip through your material at your own pace. No scoring, no pressure — just recall.',
  },
  {
    name: 'Multiple Choice',
    description:
      'Pick from four options and find out straight away whether you got it right.',
  },
  {
    name: 'Identification',
    description:
      'Type the exact answer from memory. Case and spacing are forgiving; the wording is not.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-4 sm:p-6">
        <span className="text-lg font-semibold text-white">Maowi</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/login" className="text-white/80 hover:text-white">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-white/20"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
        <section className="py-16 text-center sm:py-24">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Turn your lecture notes into a study set
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            Upload your PDFs, slides and handouts. Maowi groups them into topics
            and writes the questions, so you can spend your time recalling
            instead of re-reading.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-2xl border border-white/20 bg-white/20 px-6 py-3 font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-white/30"
            >
              Create a free account
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-white/20 bg-transparent px-6 py-3 font-medium text-white backdrop-blur-md transition hover:bg-white/10"
            >
              I already have one
            </Link>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {STUDY_MODES.map((mode) => (
            <GlassCard key={mode.name}>
              <h2 className="mb-2 text-xl font-semibold text-white">{mode.name}</h2>
              <p className="text-sm text-white/70">{mode.description}</p>
            </GlassCard>
          ))}
        </section>
      </main>
    </div>
  )
}
