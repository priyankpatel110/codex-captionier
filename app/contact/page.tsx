import Link from "next/link"

export const metadata = {
  title: "Contact Us — Captionier",
}

export default function ContactPage() {
  return (
    <main className="min-h-svh bg-background px-6 py-16 text-foreground sm:px-12 lg:px-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
        >
          ← Captionier
        </Link>

        <h1 className="font-heading mt-8 text-4xl text-foreground">Contact Us</h1>

        <div className="mt-8 space-y-6 text-[15px] font-light leading-relaxed text-muted-foreground">
          <p>
            Have a question about your account, a transcription job, or billing?
            Reach out and we&apos;ll get back to you as soon as possible.
          </p>

          <div className="border border-border/40 bg-card/50 p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
              Email
            </p>
            <a
              href="mailto:gyaanichora@gmail.com"
              className="mt-2 block text-lg text-foreground hover:text-primary transition-colors"
            >
              gyaanichora@gmail.com
            </a>
          </div>

          <p>
            We typically respond within 1–2 business days. For billing or
            payment issues, please include your order ID (visible in your
            billing dashboard) so we can locate your transaction quickly.
          </p>
        </div>
      </div>
    </main>
  )
}
