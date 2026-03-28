"use client"

import Link from "next/link"
import * as React from "react"
import { IconSparkles } from "@tabler/icons-react"

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
      <section className="relative min-h-svh overflow-hidden flex flex-col justify-between">
        {/* Cinematic Backdrop & Grain */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background/95 to-background" />
          <div className="absolute -top-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-primary/20 blur-[130px] animate-[captionier-float_20s_ease-in-out_infinite]" />
          <div className="absolute -bottom-40 -left-20 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[100px] animate-[captionier-float_15s_ease-in-out_infinite_reverse]" />
          
          {/* subtle grid for editorial structure */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)]" />
        </div>

        {/* Top Navbar */}
        <header className="relative z-10 flex items-center justify-between px-6 py-8 sm:px-12 lg:px-16 animate-fade-in-up stagger-1">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.4em] text-foreground/80 hover:text-foreground transition-colors"
          >
            <IconSparkles className="size-4 text-primary" />
            Captionier
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/app" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
              Login
            </Link>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 rounded-none text-xs uppercase tracking-[0.2em] font-bold"
            >
              <Link href="/app">Start Studio</Link>
            </Button>
          </div>
        </header>

        {/* Main Hero Content */}
        <div className="relative z-10 flex flex-col gap-12 px-6 pb-16 pt-10 sm:px-12 lg:px-16 animate-fade-in-up stagger-2">
          
          <div className="max-w-4xl">
            <div className="mb-8 flex items-center gap-4">
              <div className="h-px w-12 bg-primary/50" />
              <p className="text-xs uppercase tracking-[0.4em] text-primary/80">
                Saaras v3 STT Engine
              </p>
            </div>
            
            <h1 className="font-heading text-[clamp(3.5rem,8vw,8.5rem)] leading-[0.95] tracking-tight text-foreground">
              Masterpiece <br className="hidden md:block"/> subtitles.
            </h1>
            
            <p className="mt-8 max-w-xl font-sans text-lg md:text-xl font-light leading-relaxed text-muted-foreground">
              Captionier extracts dialogue and auto-generates perfectly synced, production-ready SRT files for Indian language media. Built for speed and flow.
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-6 animate-fade-in-up stagger-3">
            <Button
              asChild
              className="bg-foreground text-background hover:bg-foreground/90 px-10 py-7 text-sm rounded-none uppercase tracking-[0.2em]"
            >
              <Link href="/app">Enter Workspace</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-border bg-transparent text-foreground hover:bg-white/5 px-10 py-7 text-sm rounded-none uppercase tracking-[0.2em]"
            >
              <Link href="/app">Upload Media</Link>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl border-t border-border/50 pt-8 animate-fade-in-up stagger-4">
            {FEATURE_LINES.map((line, i) => (
              <div key={line} className="flex flex-col gap-2">
                <span className="text-primary font-mono text-[10px] tracking-widest">0{i + 1}</span>
                <p className="text-sm font-light text-muted-foreground tracking-wide">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cinematic Showcase Section */}
      <section className="relative min-h-[70vh] flex items-center bg-card border-t border-border/30 overflow-hidden px-6 py-20 sm:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-center z-10">
          <div className="space-y-8 max-w-xl">
            <h2 className="font-heading text-4xl sm:text-5xl leading-[1.1] text-foreground">
              A rhythm for every script.
            </h2>
            <p className="font-sans text-lg font-light leading-relaxed text-muted-foreground">
              From Devanagari to Dravidian scripts, Captionier preserves the visual beauty of regional typography while maintaining strict subtitle formatting and pacing rules.
            </p>
            <div className="flex gap-4 items-center">
              <span className="h-px w-8 bg-primary/40 block"></span>
              <p className="text-xs font-mono tracking-widest text-primary/70 uppercase">Format Native</p>
            </div>
          </div>

          {/* Animated Language Block */}
          <div className="relative aspect-square sm:aspect-video lg:aspect-square bg-background border border-border/40 p-10 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Playback</span>
              <span className="text-[10px] font-mono tracking-widest text-primary">LIVE // TIMING</span>
            </div>
            
            <div className="h-40 flex items-center">
                <div 
                  key={activeLanguage.label}
                  dir={activeLanguage.dir}
                  className="font-heading text-[clamp(4rem,8vw,7rem)] leading-none text-foreground animate-fade-in-up"
                >
                  {activeLanguage.sample}
                </div>
            </div>

            <div className="flex justify-between items-end border-t border-border/30 pt-6">
              <div className="space-y-1">
                <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Script Target</p>
                <p className="text-sm tracking-widest text-foreground uppercase">{activeLanguage.label}</p>
              </div>
              <span className="font-mono text-sm text-primary">00:00:12,400</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
