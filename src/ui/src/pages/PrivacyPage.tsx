import { PageShell } from '../components/layout/PageShell'

const CONTACT_EMAIL = 'kbreyes.dev@gmail.com'

export function PrivacyPage() {
  return (
    <PageShell title="Privacy policy">
      <p className="text-body-secondary mb-0">Last updated 28 September 2026.</p>

      <p className="mb-0">
        Maowi is a study app. This page explains, in plain English, what happens
        to your data when you use it. It is not legal advice.
      </p>

      <section>
        <h2 className="h5">What we collect</h2>
        <p className="mb-0">
          You create an account with an email address and a password. The
          password is kept only as a bcrypt hash, so we cannot read it.
        </p>
      </section>

      <section>
        <h2 className="h5">Signing in</h2>
        <p className="mb-0">
          Staying signed in uses a single cookie. It is HttpOnly and
          SameSite=Strict, and it carries only a signed session token. There is
          no third-party analytics, advertising, or tracking on Maowi.
        </p>
      </section>

      <section>
        <h2 className="h5">Your uploads</h2>
        <p className="mb-0">
          When you create a module, the files you attach are parsed in memory
          and sent to Google's Gemini API to generate questions. They are then
          discarded: your uploads are never written to our database and never
          stored on disk.
        </p>
      </section>

      <section>
        <h2 className="h5">What we keep</h2>
        <p className="mb-0">
          We store the modules you create, the question set generated for each
          one, and the scored runs you finish in multiple choice and
          identification. Flashcards are not scored and are not recorded.
        </p>
      </section>

      <section>
        <h2 className="h5">Payments</h2>
        <p className="mb-0">
          There are none. Maowi never asks for payment details, so there is no
          billing data to collect.
        </p>
      </section>

      <section>
        <h2 className="h5">Deleting your data</h2>
        <p className="mb-0">
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to have
          your account and its data removed.
        </p>
      </section>
    </PageShell>
  )
}
