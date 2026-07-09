import Link from "next/link"

export const metadata = {
  title: "Terms & Conditions — Captionier",
}

export default function TermsPage() {
  return (
    <main className="min-h-svh bg-background px-6 py-16 text-foreground sm:px-12 lg:px-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
        >
          ← Captionier
        </Link>

        <h1 className="font-heading mt-8 text-4xl text-foreground">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-xs text-muted-foreground/60">
          Last updated: July 2026
        </p>

        <div className="mt-8 space-y-8 text-[15px] font-light leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-heading text-xl text-foreground">1. The Service</h2>
            <p className="mt-2">
              Captionier is a web application that transcribes audio and video
              files into subtitle (SRT) files across Indian languages and
              English. By using Captionier, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">2. Accounts</h2>
            <p className="mt-2">
              You need an account (via our sign-in provider) to use Captionier.
              You&apos;re responsible for keeping your account credentials
              secure and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">
              3. Credits & Billing
            </h2>
            <p className="mt-2">
              New accounts receive a starting allotment of free transcription
              credits, measured in generation time. Additional credits can be
              purchased in-app; prices are listed in Indian Rupees (INR) on
              the Billing page. Payments are processed by Cashfree Payments.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">
              4. Acceptable Use
            </h2>
            <p className="mt-2">
              You agree not to upload content you don&apos;t have the rights
              to process, or use the service for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">
              5. Changes
            </h2>
            <p className="mt-2">
              We may update these terms from time to time. Continued use of
              Captionier after changes are posted constitutes acceptance of
              the revised terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">6. Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach us at{" "}
              <a
                href="mailto:gyaanichora@gmail.com"
                className="text-primary hover:underline"
              >
                gyaanichora@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
