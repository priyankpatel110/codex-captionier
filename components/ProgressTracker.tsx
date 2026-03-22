"use client"

import * as React from "react"

import type { TranscriptionJob } from "@/types"

const STATUS_LABELS: Record<TranscriptionJob["status"], string> = {
  idle: "Waiting",
  extracting: "Extracting audio from video",
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
    <div className="space-y-4 border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Progress
          </p>
          <p className="mt-2 text-sm font-medium">{STATUS_LABELS[job.status]}</p>
          <p className="mt-1 text-sm text-muted-foreground">{job.message}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-medium tabular-nums">{job.progress}%</p>
          {active ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatElapsed(elapsedSeconds)} elapsed
            </p>
          ) : null}
        </div>
      </div>
      <div className="h-2 overflow-hidden border border-border bg-background">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${job.progress}%` }}
        />
      </div>
      {elapsedSeconds > 30 && active ? (
        <p className="text-xs text-muted-foreground">
          This may take a moment for longer files.
        </p>
      ) : null}
      {job.detectedLanguage ? (
        <p className="text-xs text-muted-foreground">
          Detected language: {job.detectedLanguage}
        </p>
      ) : null}
      {job.error ? <p className="text-sm text-destructive">{job.error}</p> : null}
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
