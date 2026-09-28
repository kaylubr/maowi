import { PageShell } from '../components/layout/PageShell'

const CONTACT_EMAIL = 'kbreyes.dev@gmail.com'

export function TermsPage() {
  return (
    <PageShell title="Terms of service">
      <p className="text-body-secondary mb-0">Last updated 28 September 2026.</p>

      <p className="mb-0">
        These terms cover using Maowi. It is not legal advice, and by creating
        an account you accept them.
      </p>

      <section>
        <h2 className="h5">The service</h2>
        <p className="mb-0">
          Maowi turns files you upload into practice questions for your own
          study. It is a study aid, not a substitute for your course material.
        </p>
      </section>

      <section>
        <h2 className="h5">Your account</h2>
        <p className="mb-0">
          Keep your password to yourself. You are responsible for what happens
          under your account.
        </p>
      </section>

      <section>
        <h2 className="h5">Your uploads</h2>
        <p className="mb-0">
          Only upload material you have the right to use. Do not upload
          anything unlawful, and do not try to break or abuse the service.
        </p>
      </section>

      <section>
        <h2 className="h5">Generated questions</h2>
        <p className="mb-0">
          The questions are written by an AI model and can be wrong. They are
          provided as they are, with no guarantee that they are correct or that
          studying with them will give you any particular result.
        </p>
      </section>

      <section>
        <h2 className="h5">Availability and changes</h2>
        <p className="mb-0">
          Maowi may change or stop at any time. We are not liable for lost data
          or for anything you lose by relying on the service.
        </p>
      </section>

      <section>
        <h2 className="h5">Closing your account</h2>
        <p className="mb-0">
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to close
          your account.
        </p>
      </section>
    </PageShell>
  )
}
