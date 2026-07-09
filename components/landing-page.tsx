"use client"

import Link from "next/link"
import * as React from "react"
import { IconCheck, IconSparkles } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

const FEATURE_LINES = [
  "23 Indian languages + English",
  "Any video or audio format",
  "Precise word-level sync",
]

const LANGUAGE_SHOWCASE = [
  { label: "Hindi", sample: "सिनेमा", dir: "ltr" as const },
  { label: "Tamil", sample: "திரைப்படம்", dir: "ltr" as const },
  { label: "Telugu", sample: "చలనచిత్రం", dir: "ltr" as const },
  { label: "Bengali", sample: "চলচ্চিত্র", dir: "ltr" as const },
  { label: "Gujarati", sample: "સિનેમા", dir: "ltr" as const },
]

const MARQUEE_SCRIPTS = [
  { text: "सिनेमा", lang: "HI" },
  { text: "திரைப்படம்", lang: "TA" },
  { text: "చలనచిత్రం", lang: "TE" },
  { text: "চলচ্চিত্র", lang: "BN" },
  { text: "સિનેમા", lang: "GU" },
  { text: "ਸਿਨੇਮਾ", lang: "PA" },
  { text: "ಸಿನಿಮಾ", lang: "KN" },
  { text: "സിനിമ", lang: "ML" },
  { text: "ଚଳଚ୍ଚିତ୍ର", lang: "OR" },
  { text: "Cinema", lang: "EN" },
]

export function LandingPage() {
  const [languageIndex, setLanguageIndex] = React.useState(0)

  React.useEffect(() => {
    const languageTimer = window.setInterval(() => {
      setLanguageIndex((current) => (current + 1) % LANGUAGE_SHOWCASE.length)
    }, 2800)
    return () => window.clearInterval(languageTimer)
  }, [])

  const activeLanguage = LANGUAGE_SHOWCASE[languageIndex]

  return (
    <main className="min-h-svh overflow-x-hidden bg-background text-foreground selection:bg-primary/30">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-svh overflow-hidden flex flex-col">

        {/* Layered atmospheric backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Primary warm glow — top-right */}
          <div className="absolute -top-40 -right-40 h-[52rem] w-[52rem] rounded-full bg-primary/[0.07] blur-[140px] animate-[captionier-float_22s_ease-in-out_infinite] will-change-transform" style={{ transform: "translateZ(0)" }} />
          {/* Secondary cool glow — bottom-left */}
          <div className="absolute -bottom-32 -left-20 h-[38rem] w-[38rem] rounded-full bg-primary/[0.04] blur-[100px] animate-[captionier-float_17s_ease-in-out_infinite_reverse] will-change-transform" style={{ transform: "translateZ(0)" }} />
          {/* Film-strip vertical rules */}
          <div className="absolute top-0 right-[7rem] bottom-0 w-px bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
          <div className="absolute top-0 right-[8.5rem] bottom-0 w-px bg-gradient-to-b from-transparent via-border/20 to-transparent" />
          {/* Editorial grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, oklch(1 0 0 / 0.025) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.025) 1px, transparent 1px)",
              backgroundSize: "5rem 5rem",
              maskImage:
                "radial-gradient(ellipse 80% 80% at 50% 30%, #000 20%, transparent 100%)",
            }}
          />
          {/* Film grain */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* ── Navbar ── */}
        <header className="relative z-10 flex items-center justify-between px-6 py-7 sm:px-12 lg:px-20 animate-fade-in-up stagger-1">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/25 blur-lg rounded-full scale-[2] group-hover:scale-[2.5] transition-transform duration-500" />
              <IconSparkles className="relative size-[15px] text-primary" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.48em] text-foreground/70 group-hover:text-foreground transition-colors duration-300">
              Captionier
            </span>
          </Link>

          <nav className="flex items-center gap-8">
            <Link
              href="/app"
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Login
            </Link>
            <Button
              asChild
              className="relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary h-9 px-7 rounded-none text-[10px] uppercase tracking-[0.3em] font-bold group"
            >
              <Link href="/app">
                <span className="relative z-10">Start Studio</span>
                <span className="absolute inset-0 bg-foreground/[0.08] -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </Link>
            </Button>
          </nav>
        </header>

        {/* ── Hero Content ── */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pt-4 pb-24 sm:px-12 lg:px-20">
          <div className="max-w-5xl">

            {/* Eyebrow */}
            <div className="mb-10 flex items-center gap-3 animate-fade-in-up stagger-2">
              <div className="flex gap-[3px] items-center">
                <span className="size-[6px] rounded-full bg-primary animate-pulse" />
                <span className="size-[4px] rounded-full bg-primary/50" />
                <span className="size-[3px] rounded-full bg-primary/30" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-primary/75 font-mono">
                Saaras v3 STT Engine
              </p>
              <div className="h-px w-16 bg-gradient-to-r from-primary/40 to-transparent" />
            </div>

            {/* Headline */}
            <div className="animate-fade-in-up stagger-2">
              <h1 className="font-heading leading-[0.92] tracking-[-0.02em]">
                <span className="block text-[clamp(3.8rem,9.5vw,10rem)] text-foreground">
                  Masterpiece
                </span>
                <span className="block text-[clamp(3.8rem,9.5vw,10rem)] text-primary/85 italic">
                  subtitles.
                </span>
              </h1>
            </div>

            {/* Mock subtitle bar — visual metaphor for the product */}
            <div className="mt-10 mb-8 relative inline-flex items-center gap-4 px-5 py-3 border border-border/40 bg-card/70 animate-fade-in-up stagger-3 max-w-full overflow-hidden">
              <div className="flex items-center gap-2 text-[10px] font-mono text-primary/60 shrink-0">
                <span>00:00:02,100</span>
                <span className="text-border/80">→</span>
                <span>00:00:05,840</span>
              </div>
              <div className="h-3 w-px bg-border/40 shrink-0" />
              <p className="text-[13px] font-light text-muted-foreground/70 italic truncate">
                &ldquo;Captionier extracts dialogue and auto-generates perfectly synced SRT files.&rdquo;
              </p>
              {/* Top accent line */}
              <span className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
            </div>

            <p className="max-w-md font-sans text-[15px] font-light leading-relaxed text-muted-foreground animate-fade-in-up stagger-3">
              Production-ready SRT files for Indian language media. Built for speed and creative flow.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-4">
            <Button
              asChild
              className="relative overflow-hidden bg-foreground text-background hover:bg-foreground/90 h-14 px-10 text-[11px] rounded-none uppercase tracking-[0.3em] group"
            >
              <Link href="/app">
                Enter Workspace
                <span className="absolute inset-y-0 right-0 w-[3px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-border/50 bg-transparent text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 h-14 px-10 text-[11px] rounded-none uppercase tracking-[0.3em] transition-colors duration-300"
            >
              <Link href="/app">Upload Media</Link>
            </Button>
          </div>

          {/* Feature list */}
          <div className="mt-14 max-w-2xl animate-fade-in-up stagger-5">
            <div className="h-px bg-gradient-to-r from-border/60 via-primary/20 to-transparent mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FEATURE_LINES.map((line, i) => (
                <div key={line} className="flex items-start gap-3 group">
                  <span className="text-primary font-mono text-[9px] tracking-[0.2em] mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity duration-200">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[11px] font-light text-muted-foreground tracking-wide leading-relaxed">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE TICKER ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-y border-border/35 bg-card/25 py-[18px]">
        {/* Edge fade masks */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex gap-10 animate-marquee whitespace-nowrap">
          {[...MARQUEE_SCRIPTS, ...MARQUEE_SCRIPTS].map((script, i) => (
            <span key={i} className="inline-flex items-center gap-4 shrink-0">
              <span className="font-heading text-2xl text-foreground/55 hover:text-primary transition-colors duration-300 cursor-default">
                {script.text}
              </span>
              <span className="text-[8px] font-mono text-primary/40 tracking-[0.35em]">
                {script.lang}
              </span>
              <span className="size-[3px] rounded-full bg-border/50 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── SHOWCASE SECTION ─────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden px-6 py-24 sm:px-12 lg:px-20">
        {/* Background ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[130px]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 w-full items-center z-10">

          {/* Text column */}
          <div className="space-y-8 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-primary/45" />
              <p className="text-[10px] font-mono tracking-[0.4em] text-primary/65 uppercase">
                Format Native
              </p>
            </div>
            <h2 className="font-heading text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.04] text-foreground">
              A rhythm for every script.
            </h2>
            <p className="font-sans text-[15px] font-light leading-relaxed text-muted-foreground">
              From Devanagari to Dravidian scripts, Captionier preserves the visual beauty of regional typography while maintaining strict subtitle formatting and pacing rules.
            </p>
          </div>

          {/* Language card — film frame style */}
          <div className="relative">
            {/* Corner brackets */}
            <div className="absolute -top-4 -left-4 w-9 h-9 border-t-2 border-l-2 border-primary/45" />
            <div className="absolute -top-4 -right-4 w-9 h-9 border-t-2 border-r-2 border-primary/45" />
            <div className="absolute -bottom-4 -left-4 w-9 h-9 border-b-2 border-l-2 border-primary/45" />
            <div className="absolute -bottom-4 -right-4 w-9 h-9 border-b-2 border-r-2 border-primary/45" />

            <div className="relative aspect-[4/3] bg-background/90 border border-border/35 p-10 flex flex-col justify-between overflow-hidden">
              {/* Top accent */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              {/* Header row */}
              <div className="flex justify-between items-start">
                <span className="text-[9px] tracking-[0.4em] uppercase text-muted-foreground/50 font-mono">
                  Playback
                </span>
                <div className="flex items-center gap-2">
                  <span className="size-[6px] rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-mono tracking-widest text-primary/65">LIVE // TIMING</span>
                </div>
              </div>

              {/* Script display */}
              <div className="flex-1 flex items-center">
                <div
                  key={activeLanguage.label}
                  dir={activeLanguage.dir}
                  className="font-heading text-[clamp(4rem,8vw,7.5rem)] leading-none text-foreground animate-fade-in-up"
                >
                  {activeLanguage.sample}
                </div>
              </div>

              {/* Footer row */}
              <div className="border-t border-border/25 pt-5 flex justify-between items-end">
                <div className="space-y-[5px]">
                  <p className="text-[9px] tracking-[0.3em] text-muted-foreground/45 uppercase font-mono">
                    Script Target
                  </p>
                  <p className="text-[13px] tracking-[0.18em] text-foreground font-medium uppercase">
                    {activeLanguage.label}
                  </p>
                </div>
                <div className="text-right space-y-[5px]">
                  <p className="text-[9px] tracking-[0.3em] text-muted-foreground/45 uppercase font-mono">
                    Timecode
                  </p>
                  <span className="font-mono text-[13px] text-primary">00:00:12,400</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ──────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative flex items-center overflow-hidden px-6 py-24 sm:px-12 lg:px-20 border-t border-border/35"
      >
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-primary/45" />
            <p className="text-[10px] font-mono tracking-[0.4em] text-primary/65 uppercase">
              Pricing
            </p>
          </div>
          <h2 className="font-heading mt-4 text-[clamp(2.4rem,5vw,3.5rem)] leading-[1.04] text-foreground">
            Simple, pay-as-you-go.
          </h2>
          <p className="mt-4 font-sans text-[15px] font-light leading-relaxed text-muted-foreground">
            New accounts start with free credits. Need more generation time?
            Top up instantly.
          </p>

          <div className="mt-10 border border-border/40 bg-card/50 p-8">
            <div className="flex items-center gap-2">
              <IconSparkles className="size-5 text-primary" />
              <h3 className="font-heading text-xl text-foreground">Pro Tier</h3>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">₹49</span>
              <span className="text-muted-foreground">/ hour of generation</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                <span>+1 hour (60 mins) of transcription credits</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                <span>Credits never expire</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                <span>All 23 supported Indian languages + English</span>
              </li>
            </ul>
            <p className="mt-6 text-xs text-muted-foreground/60">
              Prices are listed in Indian Rupees (INR). Payments are securely
              processed by Cashfree Payments.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border/35 px-6 py-10 sm:px-12 lg:px-20">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            © {new Date().getFullYear()} Captionier
          </p>
          <nav className="flex items-center gap-6">
            <Link
              href="/contact"
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/terms"
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/refunds"
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
            >
              Refunds & Cancellations
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
