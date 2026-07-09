import Link from "next/link"

export const metadata = {
  title: "Refunds & Cancellations — Captionier",
}

export default function RefundsPage() {
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
          Refunds & Cancellations
        </h1>
        <p className="mt-2 text-xs text-muted-foreground/60">
          Last updated: July 2026
        </p>

        <div className="mt-8 space-y-8 text-[15px] font-light leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-heading text-xl text-foreground">
              Digital credits
            </h2>
            <p className="mt-2">
              Captionier sells transcription credits, which are delivered to
              your account instantly and automatically once payment is
              confirmed. Because credits are consumed on-demand and delivered
              immediately, purchases are generally non-refundable once
              credits have been added to your account.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">
              Failed or duplicate payments
            </h2>
            <p className="mt-2">
              If a payment was deducted from your account but credits were
              not added, or you were charged more than once for the same
              order, contact us with your order ID and we will investigate
              and issue a refund for any confirmed billing error.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">
              Cancellations
            </h2>
            <p className="mt-2">
              Since credit purchases are processed and delivered immediately,
              there is no cancellation window after checkout completes. If
              you have not completed payment, you can simply close the
              checkout window at any time with no charge.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-foreground">
              How to request a refund
            </h2>
            <p className="mt-2">
              Email{" "}
              <a
                href="mailto:gyaanichora@gmail.com"
                className="text-primary hover:underline"
              >
                gyaanichora@gmail.com
              </a>{" "}
              with your order ID and a description of the issue. Approved
              refunds are processed back to your original payment method
              within 5–7 business days.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
