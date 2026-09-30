import { Link } from 'react-router-dom'

import { ThemeChoice } from '../components/ui/ThemeChoice'

export function SettingsPage() {
  return (
    <div className="brand-fade">
      <h1 className="h3 mb-4">Settings</h1>

      <section className="card brand-card mb-4">
        <div className="card-body">
          <div className="brand-eyebrow mb-1">Appearance</div>
          <p className="text-body-secondary mb-3">
            Choose how Maowi looks. System follows your device setting.
          </p>
          <ThemeChoice />
        </div>
      </section>

      <section className="card brand-card">
        <div className="card-body">
          <div className="brand-eyebrow mb-1">Account</div>
          <p className="text-body-secondary mb-3">
            Manage your username and avatar.
          </p>
          <Link to="/profile" className="btn btn-secondary">
            Go to profile
          </Link>
        </div>
      </section>
    </div>
  )
}
