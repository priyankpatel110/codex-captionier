"use client"

import * as React from "react"

import type { TranscriptionJob } from "@/types"

const STATUS_LABELS: Record<TranscriptionJob["status"], string> = {
  idle: "Waiting",
  extracting: "Extracting audio from video",
  compressing: "Compressing video locally",
  uploading: "Uploading audio to Sarvam",
  transcribing: "Transcribing with Saaras v3",
  generating: "Generating SRT timestamps",
  done: "Done",
  error: "Failed",
}

type ProgressTrackerProps = {
  job: TranscriptionJob
}

export function ProgressTracker({ job }: ProgressTrackerProps) {
  const active = !["idle", "done", "error"].includes(job.status)
  const startedAtRef = React.useRef<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)

  React.useEffect(() => {
    if (!active) {
      startedAtRef.current = null
      setElapsedSeconds(0)
      return
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now()
    }

    const interval = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [active, job.status])

  return (
    <div className="relative overflow-hidden space-y-5 border border-border bg-card p-6 shadow-lg">
      {active && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
      )}

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {active && (
              <div className="size-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_rgba(255,180,60,0.8)]" />
            )}
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground">
              Job Status
            </p>
          </div>
          <p className="font-heading mt-3 text-lg font-medium tracking-wide text-primary">
            {STATUS_LABELS[job.status]}
          </p>
          <p className="mt-1 font-mono text-xs tracking-tight text-muted-foreground/80">
            {job.message}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-3xl font-light tabular-nums text-foreground drop-shadow-sm">
            {job.progress}%
          </p>
          {active ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {formatElapsed(elapsedSeconds)} elapsed
            </p>
          ) : null}
        </div>
      </div>
      
      <div className="relative z-10 h-1 overflow-hidden bg-background border-y border-border/50">
        <div
          className="h-full bg-primary shadow-[0_0_10px_rgba(255,180,60,1)] transition-[width] duration-500 ease-out"
          style={{ width: `${job.progress}%` }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-1.5 pt-1">
        {elapsedSeconds > 30 && active ? (
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Processing large files may take a moment.
          </p>
        ) : null}
        {job.detectedLanguage ? (
          <p className="font-mono text-[10px] uppercase tracking-wider text-primary/70">
            Detected language: {job.detectedLanguage}
          </p>
        ) : null}
        {job.error ? (
          <p className="font-mono text-xs font-semibold text-destructive shadow-destructive/20 drop-shadow-md">
            {job.error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}
