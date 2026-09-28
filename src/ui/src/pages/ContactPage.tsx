import { PageShell } from '../components/layout/PageShell'

const CONTACT_EMAIL = 'kbreyes.dev@gmail.com'

export function ContactPage() {
  return (
    <PageShell title="Contact">
      <p className="mb-0">
        Questions, bugs, or account requests: email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </PageShell>
  )
}
