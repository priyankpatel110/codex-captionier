"use client"

import {
  IconCircleCheck,
  IconClockHour4,
  IconCopy,
  IconFileMusic,
  IconLanguage,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react"
import { UserButton } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import * as React from "react"

import { api } from "@/convex/_generated/api"
import { DownloadButton } from "@/components/DownloadButton"
import { FileUpload } from "@/components/FileUpload"
import { LanguageSelector } from "@/components/LanguageSelector"
import { ProgressTracker } from "@/components/ProgressTracker"
import { SRTPreview } from "@/components/SRTPreview"
import { Button } from "@/components/ui/button"
import { buildSRTContent, parseSRTContent, validateSRT } from "@/lib/srt"
import type {
  CaptionSettings,
  LanguageOption,
  SarvamLanguageCode,
  TranscribeApiResponse,
  TranscriptionJob,
  TranscriptionMode,
  UsageSummary,
} from "@/types"

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: "Auto detect", value: "unknown" },
  { label: "Hindi", value: "hi-IN" },
  { label: "Bengali", value: "bn-IN" },
  { label: "Kannada", value: "kn-IN" },
  { label: "Malayalam", value: "ml-IN" },
  { label: "Marathi", value: "mr-IN" },
  { label: "Odia", value: "od-IN" },
  { label: "Punjabi", value: "pa-IN" },
  { label: "Tamil", value: "ta-IN" },
  { label: "Telugu", value: "te-IN" },
  { label: "English", value: "en-IN" },
  { label: "Gujarati", value: "gu-IN" },
  { label: "Assamese", value: "as-IN" },
  { label: "Urdu", value: "ur-IN" },
  { label: "Nepali", value: "ne-IN" },
  { label: "Konkani", value: "kok-IN" },
  { label: "Kashmiri", value: "ks-IN" },
  { label: "Sindhi", value: "sd-IN" },
  { label: "Sanskrit", value: "sa-IN" },
  { label: "Santali", value: "sat-IN" },
  { label: "Manipuri", value: "mni-IN" },
  { label: "Bodo", value: "brx-IN" },
  { label: "Maithili", value: "mai-IN" },
  { label: "Dogri", value: "doi-IN" },
]

const MODE_OPTIONS: Array<{ label: string; value: TranscriptionMode }> = [
  { label: "Transcribe", value: "transcribe" },
  { label: "Translate to English", value: "translate" },
  { label: "Transliterate", value: "translit" },
  { label: "Code-mixed", value: "codemix" },
]

const DEFAULT_SETTINGS: CaptionSettings = {
  maxWordsPerBlock: 7,
  maxDurationSeconds: 4,
  mode: "transcribe",
}

const IDLE_JOB: TranscriptionJob = {
  status: "idle",
  progress: 0,
  message:
    "Select a file to begin the upload, transcription, and SRT generation flow.",
}

export function CaptionierApp() {
  const [file, setFile] = React.useState<File | null>(null)
  const [languageCode, setLanguageCode] =
    React.useState<SarvamLanguageCode>("unknown")
  const [job, setJob] = React.useState<TranscriptionJob>(IDLE_JOB)
  const [preview, setPreview] = React.useState("")
  const [downloadName, setDownloadName] = React.useState("captions.srt")
  const [settings, setSettings] =
    React.useState<CaptionSettings>(DEFAULT_SETTINGS)
  const [audioDurationSeconds, setAudioDurationSeconds] = React.useState<
    number | null
  >(null)
  const [usedChunking, setUsedChunking] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [localMediaDuration, setLocalMediaDuration] = React.useState<
    number | null
  >(null)
  const [usageOverride, setUsageOverride] = React.useState<UsageSummary | null>(
    null
  )

  const liveUsage = useQuery(api.users.getCurrentUserUsage) as
    | UsageSummary
    | null
    | undefined
  const usage = usageOverride ?? liveUsage ?? null
  const parsedBlocks = React.useMemo(() => parseSRTContent(preview), [preview])
  const validation = React.useMemo(() => validateSRT(preview), [preview])
  const totalDuration =
    parsedBlocks.length > 0
      ? parsedBlocks[parsedBlocks.length - 1].endSeconds
      : 0
  const remainingSeconds = usage?.availableSeconds ?? null

  const shortBlockCount = parsedBlocks.filter(
    (block) => block.durationSeconds < 0.5
  ).length
  const longBlockCount = parsedBlocks.filter(
    (block) => block.durationSeconds > 6
  ).length
  const syncDiscrepancy =
    audioDurationSeconds && audioDurationSeconds > 0
      ? Math.abs(totalDuration - audioDurationSeconds) / audioDurationSeconds
      : 0

  const appState = getAppState(file, job)
  const isProcessing =
    job.status === "extracting" ||
    job.status === "uploading" ||
    job.status === "transcribing" ||
    job.status === "generating"
  const canGenerate = remainingSeconds === null || remainingSeconds > 0
  const fitsCurrentBalance =
    remainingSeconds === null ||
    localMediaDuration === null ||
    Math.ceil(localMediaDuration) <= remainingSeconds

  React.useEffect(() => {
    if (liveUsage) {
      setUsageOverride(liveUsage)
    }
  }, [liveUsage])

  React.useEffect(() => {
    if (!file) {
      setLocalMediaDuration(null)
      return
    }

    let revoked = false
    const objectUrl = URL.createObjectURL(file)
    const media = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio"
    )
    media.preload = "metadata"
    media.src = objectUrl

    const onLoadedMetadata = () => {
      if (!revoked && Number.isFinite(media.duration)) {
        setLocalMediaDuration(media.duration)
      }
      URL.revokeObjectURL(objectUrl)
    }

    const onError = () => {
      if (!revoked) {
        setLocalMediaDuration(null)
      }
      URL.revokeObjectURL(objectUrl)
    }

    media.addEventListener("loadedmetadata", onLoadedMetadata)
    media.addEventListener("error", onError)

    return () => {
      revoked = true
      media.removeEventListener("loadedmetadata", onLoadedMetadata)
      media.removeEventListener("error", onError)
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  React.useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = window.setTimeout(() => {
      setCopied(false)
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [copied])

  const handleSubmit = async () => {
    if (!file) {
      return
    }

    if (!fitsCurrentBalance) {
      setJob({
        status: "error",
        progress: 100,
        message: "This file is longer than your remaining credits.",
        error: "Your free 10-minute balance is exhausted for this file.",
      })
      return
    }

    try {
      setCopied(false)
      setPreview("")
      setAudioDurationSeconds(null)
      setUsedChunking(false)
      setJob({
        status: file.type.startsWith("video/") ? "extracting" : "uploading",
        progress: file.type.startsWith("video/") ? 10 : 30,
        message: file.type.startsWith("video/")
          ? "Extracting audio from your video before upload."
          : "Uploading audio to Sarvam.",
      })

      const formData = new FormData()
      formData.append("audio", file)
      formData.append("mode", settings.mode)
      if (languageCode !== "unknown") {
        formData.append("languageCode", languageCode)
      }

      if (file.type.startsWith("video/")) {
        setJob({
          status: "uploading",
          progress: 30,
          message: "Uploading extracted audio to Sarvam.",
        })
      }

      setJob({
        status: "transcribing",
        progress: 60,
        message: "Transcribing with Saaras v3. Longer files may take a moment.",
      })

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as
        | TranscribeApiResponse
        | { error: string }

      if (!response.ok || "error" in payload) {
        throw new Error(
          mapErrorMessage(
            "error" in payload ? payload.error : "Transcription failed."
          )
        )
      }

      setUsageOverride(payload.credits)
      setJob({
        status: "generating",
        progress: 95,
        message:
          "Generating SRT, validating caption quality, and preparing download.",
        detectedLanguage: payload.language_code ?? undefined,
      })

      const srtContent = payload.timestamps?.words
        ? buildSRTContent(payload.timestamps.words, {
            maxWordsPerBlock: settings.maxWordsPerBlock,
            maxDurationSeconds: settings.maxDurationSeconds,
          })
        : ""

      setPreview(srtContent)
      setAudioDurationSeconds(payload.audio_duration_seconds)
      setUsedChunking(payload.used_chunking)
      setDownloadName(
        buildDownloadFilename(
          file.name,
          payload.language_code ?? languageCode ?? "unknown"
        )
      )

      setJob({
        status: "done",
        progress: 100,
        message: srtContent
          ? "Captions generated successfully."
          : "No speech was detected in the uploaded file.",
        detectedLanguage: payload.language_code ?? undefined,
        srtContent,
      })
    } catch (error) {
      setJob({
        status: "error",
        progress: 100,
        message: "The request did not complete.",
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      })
    }
  }

  const handleReset = () => {
    setFile(null)
    setLanguageCode("unknown")
    setSettings(DEFAULT_SETTINGS)
    setJob(IDLE_JOB)
    setPreview("")
    setDownloadName("captions.srt")
    setAudioDurationSeconds(null)
    setUsedChunking(false)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!preview) {
      return
    }

    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(242,197,61,0.2),_transparent_24%),linear-gradient(180deg,_transparent,_rgba(17,24,39,0.04))]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="space-y-6 border border-border bg-background/90 p-5 backdrop-blur sm:p-8">
          <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1 text-[11px] tracking-[0.32em] text-muted-foreground uppercase">
                <IconSparkles className="size-3.5" />
                Captionier
              </span>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl leading-none font-medium tracking-tight sm:text-5xl">
                  Generate production-ready SRT captions for Indian language
                  media.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Upload audio or video, choose how captions should be
                  formatted, and export clean SRT files with synced timing for
                  Indian language content.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-3 sm:min-w-72">
              <div className="space-y-1">
                <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
                  Remaining credits
                </p>
                <p className="text-lg font-medium">
                  {formatCreditBalance(remainingSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Free accounts start with 10 minutes of generation time.
                </p>
              </div>
              <UserButton />
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatusCard
                  icon={<IconClockHour4 className="size-4" />}
                  label="Available now"
                  value={formatCreditBalance(remainingSeconds)}
                  detail={
                    usage
                      ? `${formatDuration(usage.creditsRemainingSeconds)} total balance, ${formatDuration(usage.pendingSeconds)} pending`
                      : "Loading your credit balance."
                  }
                />
                <StatusCard
                  icon={<IconFileMusic className="size-4" />}
                  label="Current file"
                  value={
                    localMediaDuration
                      ? formatDuration(localMediaDuration)
                      : "No file selected"
                  }
                  detail={
                    !localMediaDuration
                      ? "Pick an audio or video file to estimate credit use."
                      : fitsCurrentBalance
                        ? "This upload fits within your current balance."
                        : "This upload exceeds your remaining credits and will be blocked."
                  }
                />
              </div>

              <FileUpload
                file={file}
                onFileChange={setFile}
                disabled={isProcessing}
              />

              {localMediaDuration ? (
                <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
                  Estimated processing time: about{" "}
                  {estimateProcessingTime(localMediaDuration)} for this media.
                </div>
              ) : null}

              {!canGenerate ? (
                <div className="border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                  Your free credits are exhausted. The paywall hook can attach
                  here next.
                </div>
              ) : null}

              {!fitsCurrentBalance && localMediaDuration ? (
                <div className="border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                  This file needs about {formatDuration(localMediaDuration)},
                  but you only have {formatCreditBalance(remainingSeconds)}{" "}
                  left.
                </div>
              ) : null}

              {appState !== "idle" ? (
                <div className="space-y-5 border border-border bg-card p-5">
                  <div className="space-y-2">
                    <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                      Settings
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Choose the language, output mode, and caption style before
                      generation.
                    </p>
                  </div>

                  <LanguageSelector
                    value={languageCode}
                    onChange={setLanguageCode}
                    options={LANGUAGE_OPTIONS}
                    disabled={isProcessing}
                  />

                  <details
                    className="border border-border bg-background p-4"
                    open
                  >
                    <summary className="cursor-pointer text-sm font-medium">
                      Advanced settings
                    </summary>
                    <div className="mt-4 space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <label htmlFor="max-words">
                            Words per caption block
                          </label>
                          <span className="text-muted-foreground">
                            {settings.maxWordsPerBlock}
                          </span>
                        </div>
                        <input
                          id="max-words"
                          type="range"
                          min="4"
                          max="12"
                          value={settings.maxWordsPerBlock}
                          disabled={isProcessing}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              maxWordsPerBlock: Number(event.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <label htmlFor="max-duration">
                            Max block duration
                          </label>
                          <span className="text-muted-foreground">
                            {settings.maxDurationSeconds.toFixed(1)}s
                          </span>
                        </div>
                        <input
                          id="max-duration"
                          type="range"
                          min="2"
                          max="6"
                          step="0.5"
                          value={settings.maxDurationSeconds}
                          disabled={isProcessing}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              maxDurationSeconds: Number(event.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium">Output mode</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {MODE_OPTIONS.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 border border-border px-3 py-3 text-sm"
                            >
                              <input
                                type="radio"
                                name="output-mode"
                                value={option.value}
                                checked={settings.mode === option.value}
                                disabled={isProcessing}
                                onChange={() =>
                                  setSettings((current) => ({
                                    ...current,
                                    mode: option.value,
                                  }))
                                }
                              />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="space-y-3 border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <IconFileMusic className="size-5 text-muted-foreground" />
                      <p className="text-sm font-medium">File processing</p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {file?.type.startsWith("video/")
                        ? "Video is converted to speech-ready audio automatically before transcription."
                        : "Audio is processed directly and split automatically when needed for reliable transcription."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      size="lg"
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={
                        !file ||
                        isProcessing ||
                        !canGenerate ||
                        !fitsCurrentBalance
                      }
                    >
                      Generate captions
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      onClick={handleReset}
                      disabled={isProcessing}
                    >
                      <IconRefresh className="size-4" />
                      Start over
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              <ProgressTracker job={job} />

              {appState === "done" ? (
                <section className="space-y-5 border border-border bg-card p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <IconCircleCheck className="size-5 text-primary" />
                      <p className="text-sm font-medium">
                        Captions generated successfully
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review the generated subtitle blocks, check the warnings,
                      then download or copy the SRT output.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                      label="Detected language"
                      value={job.detectedLanguage ?? "Not detected"}
                      icon={<IconLanguage className="size-4" />}
                    />
                    <MetricCard
                      label="Caption blocks"
                      value={String(validation.blockCount)}
                    />
                    <MetricCard
                      label="Estimated duration"
                      value={formatDuration(totalDuration)}
                    />
                  </div>

                  <div className="space-y-2 border border-border bg-background p-4 text-sm">
                    <p className="font-medium">Caption quality</p>
                    <WarningLine
                      show={shortBlockCount > 0}
                      text={`${shortBlockCount} blocks are very short (< 0.5s) and may flash too quickly.`}
                    />
                    <WarningLine
                      show={longBlockCount > 0}
                      text={`${longBlockCount} blocks are very long (> 6s) and may be hard to read.`}
                    />
                    <WarningLine
                      show={syncDiscrepancy > 0.05}
                      text={`SRT duration differs from audio duration by ${(syncDiscrepancy * 100).toFixed(1)}%, which may indicate sync drift.`}
                    />
                    <WarningLine
                      show={!validation.valid}
                      text={validation.errors.join(" ")}
                    />
                    <WarningLine
                      show={usedChunking}
                      text="Long media handling was applied automatically to keep transcription stable."
                      tone="neutral"
                    />
                    {shortBlockCount === 0 &&
                    longBlockCount === 0 &&
                    syncDiscrepancy <= 0.05 &&
                    validation.valid ? (
                      <p className="text-muted-foreground">
                        No quality warnings detected for the current SRT output.
                      </p>
                    ) : null}
                  </div>

                  <SRTPreview value={preview} />

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <DownloadButton
                      content={job.srtContent ?? preview}
                      filename={downloadName}
                      disabled={job.status !== "done"}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      onClick={handleCopy}
                      disabled={!preview}
                    >
                      <IconCopy className="size-4" />
                      {copied ? "Copied" : "Copy SRT"}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      onClick={handleReset}
                    >
                      <IconRefresh className="size-4" />
                      Start over
                    </Button>
                  </div>
                </section>
              ) : (
                <SRTPreview value={preview} />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-2 border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs tracking-[0.24em] text-muted-foreground uppercase">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  )
}

function StatusCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="space-y-3 border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs tracking-[0.24em] text-muted-foreground uppercase">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-medium">{value}</p>
      <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  )
}

function WarningLine({
  show,
  text,
  tone = "warning",
}: {
  show: boolean
  text: string
  tone?: "warning" | "neutral"
}) {
  if (!show) {
    return null
  }

  return (
    <p
      className={
        tone === "warning"
          ? "text-yellow-700 dark:text-yellow-300"
          : "text-muted-foreground"
      }
    >
      {tone === "warning" ? "Warning: " : ""}
      {text}
    </p>
  )
}

function buildDownloadFilename(filename: string, languageCode: string) {
  const sanitizedBase = sanitizeFilename(filename.replace(/\.[^.]+$/, ""))
  const normalizedLanguage = sanitizeFilename(languageCode || "unknown")
  return `${sanitizedBase || "captionier"}_captions_${normalizedLanguage}.srt`
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "")
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "0s"
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

function formatCreditBalance(seconds: number | null) {
  if (seconds === null) {
    return "Loading..."
  }

  return formatDuration(seconds)
}

function estimateProcessingTime(mediaDurationSeconds: number) {
  const estimatedMinutes = Math.max(1, Math.ceil(mediaDurationSeconds / 600))
  return `${estimatedMinutes} minute${estimatedMinutes === 1 ? "" : "s"}`
}

function getAppState(file: File | null, job: TranscriptionJob) {
  if (job.status === "done") {
    return "done"
  }

  if (job.status === "error") {
    return "error"
  }

  if (job.status !== "idle") {
    return "processing"
  }

  if (file) {
    return "file_selected"
  }

  return "idle"
}

function mapErrorMessage(error: string) {
  const normalized = error.toLowerCase()

  if (normalized.includes("credits_exhausted")) {
    return "Your free credits are exhausted. Show the paywall here next."
  }

  if (normalized.includes("413") || normalized.includes("too large")) {
    return "File exceeds limit. Try compressing the audio first."
  }

  if (
    normalized.includes("unsupported") ||
    normalized.includes("only audio and video uploads")
  ) {
    return "Please upload an MP4, MOV, MP3, WAV, or M4A file."
  }

  if (
    normalized.includes("authentication failed") ||
    normalized.includes("api key") ||
    normalized.includes("server configuration")
  ) {
    return "Server configuration error. Please contact support."
  }

  if (normalized.includes("rate limit") || normalized.includes("429")) {
    return "Too many requests. Please wait a moment and try again."
  }

  if (
    normalized.includes("no speech") ||
    normalized.includes("without timestamps") ||
    normalized.includes("empty transcript")
  ) {
    return "No speech was detected in the audio. Please check the file."
  }

  return "Something went wrong. Please try again."
}
