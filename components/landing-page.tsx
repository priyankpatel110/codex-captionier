"use client"

import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"

const FEATURE_LINES = [
  "23 Indian languages and English",
  "Video and audio uploads",
  "Clean SRT export in one flow",
]

const LANGUAGE_SHOWCASE = [
  {
    label: "Hindi",
    sample: "नमस्कार",
    dir: "ltr" as const,
    scale: "scale-95",
    size: "text-[clamp(2.8rem,7.2vw,5.7rem)]",
    leading: "leading-[0.98]",
  },
  {
    label: "Gujarati",
    sample: "નમસ્કાર",
    dir: "ltr" as const,
    scale: "scale-92",
    size: "text-[clamp(2.7rem,7vw,5.4rem)]",
    leading: "leading-[0.98]",
  },
  {
    label: "Tamil",
    sample: "வணக்கம்",
    dir: "ltr" as const,
    scale: "scale-82",
    size: "text-[clamp(2.35rem,6.1vw,4.7rem)]",
    leading: "leading-[1.08]",
  },
  {
    label: "Bengali",
    sample: "নমস্কার",
    dir: "ltr" as const,
    scale: "scale-88",
    size: "text-[clamp(2.5rem,6.6vw,5rem)]",
    leading: "leading-[1.02]",
  },
  {
    label: "Telugu",
    sample: "నమస్కారం",
    dir: "ltr" as const,
    scale: "scale-72",
    size: "text-[clamp(2.15rem,5.6vw,4.2rem)]",
    leading: "leading-[1.14]",
  },
  {
    label: "Urdu",
    sample: "السلام علیکم",
    dir: "rtl" as const,
    scale: "scale-74",
    size: "text-[clamp(2.1rem,5.6vw,4.1rem)]",
    leading: "leading-[1.05]",
  },
]

const PREVIEW_FRAMES = [
  {
    start: "00:00:01,200",
    end: "00:00:03,900",
    text: "नमस्कार दोस्तों, आज हम एक नई शुरुआत कर रहे हैं।",
  },
  {
    start: "00:00:04,040",
    end: "00:00:06,360",
    text: "નમસ્કાર મિત્રો, આજે આપણે શરૂઆત કરીએ છીએ.",
  },
  {
    start: "00:00:06,520",
    end: "00:00:08,980",
    text: "வணக்கம், இது துல்லியமான சப்டைட்டில் ஓட்டம்.",
  },
  {
    start: "00:00:09,120",
    end: "00:00:11,740",
    text: "Captions stay readable, timed, and ready to export.",
  },
]

const WORKFLOW = [
  {
    step: "01",
    title: "Drop your media",
    body: "Upload an interview, lecture, reel, webinar, or raw audio track.",
  },
  {
    step: "02",
    title: "Generate timed captions",
    body: "Captionier extracts speech, aligns timing, and formats readable subtitle blocks.",
  },
  {
    step: "03",
    title: "Export and ship",
    body: "Download the SRT and move straight into editing, publishing, or review.",
  },
]

export function LandingPage() {
  const [languageIndex, setLanguageIndex] = React.useState(0)
  const [previewIndex, setPreviewIndex] = React.useState(0)

  React.useEffect(() => {
    const languageTimer = window.setInterval(() => {
      setLanguageIndex((current) => (current + 1) % LANGUAGE_SHOWCASE.length)
    }, 2200)

    const previewTimer = window.setInterval(() => {
      setPreviewIndex((current) => (current + 1) % PREVIEW_FRAMES.length)
    }, 2600)

    return () => {
      window.clearInterval(languageTimer)
      window.clearInterval(previewTimer)
    }
  }, [])

  const activeLanguage = LANGUAGE_SHOWCASE[languageIndex]
  const activePreview = PREVIEW_FRAMES[previewIndex]
  const secondaryPreview =
    PREVIEW_FRAMES[(previewIndex + 1) % PREVIEW_FRAMES.length]

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f6f1e8] text-[#191512]">
      <section className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(244,190,90,0.28),transparent_24%),radial-gradient(circle_at_82%_24%,rgba(146,87,44,0.18),transparent_22%),linear-gradient(160deg,#f8f2e8_0%,#ede2d1_48%,#dfcfbd_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,21,18,0.05)_1px,transparent_1px),linear-gradient(rgba(25,21,18,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
        <div className="absolute top-[-8rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[#ba6e33]/18 blur-3xl animate-[captionier-float_14s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[#f4be5a]/22 blur-3xl animate-[captionier-float_18s_ease-in-out_infinite]" />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="text-sm font-medium uppercase tracking-[0.35em] text-[#6f5740]"
          >
            Captionier
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/app">Login</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#191512] text-[#f7efe3] hover:bg-[#2c241e]"
            >
              <Link href="/app">Sign in</Link>
            </Button>
          </div>
        </header>

        <div className="relative z-10 grid min-h-[calc(100svh-5rem)] items-end gap-10 px-5 pb-8 sm:px-8 sm:pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:pb-12">
          <div className="max-w-xl animate-[captionier-rise_0.8s_ease-out] self-center">
            <p className="mb-4 text-sm uppercase tracking-[0.32em] text-[#7f654a]">
              Indian language caption workflow
            </p>
            <h1 className="max-w-lg text-[clamp(3.25rem,7vw,6.5rem)] leading-[0.92] font-medium tracking-[-0.05em] text-[#17120f]">
              Turn spoken video into refined subtitles.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#5f4c3a] sm:text-lg">
              Captionier creates tightly timed SRT files for Indian language media,
              so your edits, releases, and reviews move faster.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[#191512] text-[#f7efe3] hover:bg-[#2c241e]"
              >
                <Link href="/app">Open App</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#5f4c3a] bg-transparent text-[#191512] hover:bg-[#191512]/6"
              >
                <Link href="/app">Login</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-[#5f4c3a] sm:grid-cols-3">
              {FEATURE_LINES.map((line, index) => (
                <p
                  key={line}
                  className="border-t border-[#5f4c3a]/20 pt-3 animate-[captionier-rise_0.8s_ease-out]"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[28rem] items-end justify-end">
            <div className="absolute inset-x-0 top-6 h-px bg-[#5f4c3a]/18" />
            <div className="w-full max-w-2xl animate-[captionier-rise_0.95s_ease-out]">
              <div className="mb-4 border border-[#3a3028]/16 bg-[#f4eadc]/72 p-5 text-[#6f5740] backdrop-blur sm:p-7">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em]">
                  <span>Language system</span>
                  <span>Live scripts</span>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-[1.2fr_0.8fr] sm:items-end">
                  <div className="border-t border-[#3a3028]/10 pt-5">
                    <p className="max-w-xs text-xs uppercase tracking-[0.28em] text-[#8a7054]">
                      Subtitle rhythm across scripts
                    </p>
                    <div className="relative mt-5 h-32 overflow-hidden sm:h-40">
                      <div
                        key={activeLanguage.label}
                        dir={activeLanguage.dir}
                        className={`absolute inset-0 flex items-center overflow-visible animate-[captionier-rise_0.45s_ease-out] text-[#191512] ${activeLanguage.scale} ${activeLanguage.size} ${activeLanguage.leading} origin-left ${
                          activeLanguage.dir === "rtl"
                            ? "justify-end origin-right text-right tracking-[-0.01em]"
                            : "justify-start tracking-[-0.05em]"
                        }`}
                      >
                        <span className="block max-w-full whitespace-nowrap px-1">
                          {activeLanguage.sample}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 border-t border-[#3a3028]/10 pt-5 text-right">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a7054]">
                      {activeLanguage.label}
                    </p>
                    <p className="text-sm leading-7 text-[#6f5740]">
                      Captionier keeps subtitle blocks readable while preserving the
                      visual character of each script.
                    </p>
                    <div className="space-y-2 text-[11px] uppercase tracking-[0.24em] text-[#8a7054]">
                      <p>Hindi · Gujarati · Tamil</p>
                      <p>Bengali · Telugu · Urdu</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-[#3a3028] bg-[#17120f] p-4 text-[#efe4d2] shadow-[0_40px_120px_rgba(23,18,15,0.28)] sm:p-6">
                <div className="flex items-center justify-between border-b border-[#f6f1e8]/10 pb-4 text-[11px] uppercase tracking-[0.28em] text-[#b7a38c]">
                  <span>Caption preview</span>
                  <span>Live timing</span>
                </div>
                <div className="space-y-3 pt-5 font-mono text-sm">
                  <div
                    key={`${activePreview.start}-${previewIndex}`}
                    className="border border-[#f6f1e8]/10 bg-[#211a16] p-4 animate-[captionier-rise_0.5s_ease-out]"
                  >
                    <p className="text-[#f4be5a]">
                      {activePreview.start} {"→"} {activePreview.end}
                    </p>
                    <p className="mt-2 text-[#f3eadf]">{activePreview.text}</p>
                  </div>
                  <div
                    key={`${secondaryPreview.start}-${previewIndex}-secondary`}
                    className="border border-[#f6f1e8]/10 bg-[#211a16] p-4 opacity-80 animate-[captionier-rise_0.65s_ease-out]"
                  >
                    <p className="text-[#f4be5a]">
                      {secondaryPreview.start} {"→"} {secondaryPreview.end}
                    </p>
                    <p className="mt-2 text-[#f3eadf]">{secondaryPreview.text}</p>
                  </div>
                  <div className="grid gap-3 pt-2 sm:grid-cols-2">
                    <div className="border border-[#f6f1e8]/10 p-4 text-[#b7a38c]">
                      Auto language detection
                    </div>
                    <div className="border border-[#f6f1e8]/10 p-4 text-[#b7a38c]">
                      Video and audio support
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-12 lg:py-20">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-[#8a7054]">
            Built for release speed
          </p>
          <h2 className="max-w-sm text-3xl leading-tight font-medium tracking-[-0.04em] text-[#17120f] sm:text-4xl">
            One clean tool for teams shipping subtitled content every day.
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {WORKFLOW.map((item) => (
            <div
              key={item.step}
              className="space-y-3 border-t border-[#3a3028]/18 pt-4"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a7054]">
                {item.step}
              </p>
              <h3 className="text-lg font-medium text-[#191512]">{item.title}</h3>
              <p className="text-sm leading-7 text-[#5f4c3a]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-8 lg:px-12 lg:pb-12">
        <div className="border border-[#3a3028] bg-[#17120f] px-5 py-8 text-[#f7efe3] sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-[#b7a38c]">
                Start now
              </p>
              <h2 className="text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">
                Upload your first file and export captions in minutes.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[#f4be5a] text-[#191512] hover:bg-[#efb343]"
              >
                <Link href="/app">Open App</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#f7efe3]/30 bg-transparent text-[#f7efe3] hover:bg-[#f7efe3]/8"
              >
                <Link href="/app">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
