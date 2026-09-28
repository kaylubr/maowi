import { CtaBand } from '../components/landing/CtaBand'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingHeader } from '../components/landing/LandingHeader'
import { Limits } from '../components/landing/Limits'
import { ModulePreview } from '../components/landing/ModulePreview'
import { StudyModes } from '../components/landing/StudyModes'

export function LandingPage() {
  return (
    <div className="landing">
      <div data-bs-theme="dark" className="bg-dark text-white">
        <LandingHeader />
        <Hero />
      </div>

      <main>
        <HowItWorks />
        <StudyModes />
        <ModulePreview />
        <Limits />
        <CtaBand />
      </main>

      <div data-bs-theme="dark" className="bg-dark text-white">
        <LandingFooter />
      </div>
    </div>
  )
}
