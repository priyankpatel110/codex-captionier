"use client"

import {
  IconCircleCheck,
  IconClockHour4,
  IconCopy,
  IconFileMusic,
  IconLanguage,
  IconPencil,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react"
import { UserButton } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import type { FFmpeg } from "@ffmpeg/ffmpeg"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  const [savedTranscriptionId, setSavedTranscriptionId] = React.useState<string | null>(null)
  const router = useRouter()
  const [usageOverride, setUsageOverride] = React.useState<UsageSummary | null>(
    null
  )
  const [localMode, setLocalMode] = React.useState<"none" | "extract" | "compress">("none")
  const ffmpegRef = React.useRef<FFmpeg | null>(null)

  const liveUsage = useQuery(api.users.getCurrentUserUsage) as
    | UsageSummary
    | null
    | undefined
  const usage = usageOverride ?? liveUsage ?? null
  const saveTranscriptionMutation = useMutation(api.transcriptions.saveTranscription)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
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
    job.status === "compressing" ||
    job.status === "uploading" ||
    job.status === "transcribing" ||
    job.status === "generating"
  const canGenerate = remainingSeconds === null || remainingSeconds > 0
  const fitsCurrentBalance =
    remainingSeconds === null ||
    localMediaDuration === null ||
    Math.ceil(localMediaDuration) <= remainingSeconds

  const isVideo = file?.type.startsWith("video/")
  const fileExceedsLimit = file ? file.size > 500 * 1024 * 1024 : false

  React.useEffect(() => {
    if (file && isVideo) {
      if (file.size > 500 * 1024 * 1024 && localMode === "compress") {
         setLocalMode("extract")
      }
    } else {
      setLocalMode("none")
    }
  }, [file, isVideo, localMode])

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

      let uploadFile = file

      if (isVideo && localMode !== "none") {
        setJob({
          status: localMode === "extract" ? "extracting" : "compressing",
          progress: 5,
          message: localMode === "extract" ? "Extracting audio locally..." : "Compressing video locally...",
        })

        if (!(window as any).FFmpegWASM) {
          setJob({ status: "extracting", progress: 2, message: "Downloading video engine..." })
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = '/ffmpeg/ffmpeg.js'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to download video engine.'))
            document.head.appendChild(script)
          })
        }

        if (!ffmpegRef.current) {
          ffmpegRef.current = new (window as any).FFmpegWASM.FFmpeg()
          const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
          
          const loadToBlobURL = async (url: string, mimeType: string) => {
            const resp = await fetch(url)
            const buf = await resp.arrayBuffer()
            const blob = new Blob([buf], { type: mimeType })
            return URL.createObjectURL(blob)
          }

          const initFfmpeg = ffmpegRef.current!
          await initFfmpeg.load({
            coreURL: await loadToBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await loadToBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await loadToBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
          })

          initFfmpeg.on('log', ({ message }) => {
            console.log("[FFmpeg]", message)
          })
          
          initFfmpeg.on('progress', ({ progress }) => {
            setJob(prev => {
              if (prev.status !== "extracting" && prev.status !== "compressing") return prev
              return {
                ...prev,
                progress: 5 + Math.round(progress * 20),
                message: `Local processing... ${Math.round(progress * 100)}%`
              }
            })
          })
        }
        const ffmpeg = ffmpegRef.current!
        const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'))
        
        const inputData = new Uint8Array(await file.arrayBuffer())
        await ffmpeg.writeFile(inputName, inputData)

        if (localMode === "extract") {
          await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'aac', '-b:a', '128k', 'output.aac'])
          const data = await ffmpeg.readFile('output.aac')
          uploadFile = new File([data as BlobPart], file.name.replace(/\.[^/.]+$/, "") + '.aac', { type: 'audio/aac' })
        } else if (localMode === "compress") {
          await ffmpeg.exec(['-i', inputName, '-preset', 'ultrafast', '-crf', '28', '-vcodec', 'libx264', '-acodec', 'aac', 'output.mp4'])
          const data = await ffmpeg.readFile('output.mp4')
          uploadFile = new File([data as BlobPart], file.name.replace(/\.[^/.]+$/, "") + '_compressed.mp4', { type: 'video/mp4' })
        }
      }

      setJob({
        status: uploadFile.type.startsWith("video/") ? "extracting" : "uploading",
        progress: 30,
        message: uploadFile.type.startsWith("video/")
          ? "Extracting audio from your video before upload."
          : "Uploading to Sarvam.",
      })

      if (uploadFile.type.startsWith("video/")) {
        setJob({
          status: "uploading",
          progress: 35,
          message: "Uploading extracted audio to Sarvam.",
        })
      }

      const uploadUrl = await generateUploadUrl()
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": uploadFile.type },
        body: uploadFile,
      })

      if (!uploadResult.ok) {
        throw new Error("Failed to upload the file.")
      }

      const { storageId } = (await uploadResult.json()) as { storageId: string }

      setJob({
        status: "transcribing",
        progress: 60,
        message: "Transcribing with Saaras v3. Longer files may take a moment.",
      })

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageId,
          filename: uploadFile.name,
          fileType: uploadFile.type,
          mode: settings.mode,
          languageCode: languageCode !== "unknown" ? languageCode : undefined,
        }),
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

      if (srtContent) {
        try {
          const savedId = await saveTranscriptionMutation({
            filename: file.name,
            duration: payload.audio_duration_seconds ?? localMediaDuration ?? undefined,
            language: payload.language_code ?? languageCode ?? undefined,
            srtContent,
          })
          if (savedId) {
            setSavedTranscriptionId(savedId)
            const { storeVideo } = await import("@/lib/video-storage")
            try {
              await storeVideo(savedId, file)
            } catch (e) {
              console.error("Failed to cache video in IndexedDB:", e)
            }
          }
        } catch (err) {
          console.error("Failed to save transcription to history:", err)
        }
      }
    } catch (error) {
      console.error("Submit error:", error)
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
    <main className="min-h-svh bg-background/50 selection:bg-primary/30 selection:text-primary">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-8 border border-border/50 bg-card/40 p-5 shadow-2xl backdrop-blur-xl sm:p-10">
          <header className="flex flex-col gap-6 border-b border-border/40 pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary shadow-sm backdrop-blur-md animate-fade-in-up stagger-1">
                <IconSparkles className="size-3.5" />
                Workspace
              </span>
              <div className="space-y-3 animate-fade-in-up stagger-2">
                <h1 className="max-w-4xl font-heading text-4xl font-light tracking-tight text-foreground sm:text-5xl drop-shadow-sm">
                  Production-Ready <span className="font-serif italic text-primary">Captions</span>
                </h1>
                <p className="max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
                  Upload audio or video, optimize format settings, and export pristine SRT files with synced timing for Indian language content.
                </p>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-6 border border-border/50 bg-card/80 p-5 shadow-md backdrop-blur-sm sm:w-auto animate-fade-in-up stagger-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Credits Remaining
                </p>
                <p className="font-heading text-2xl font-light text-foreground drop-shadow-sm">
                  {formatCreditBalance(remainingSeconds)}
                </p>
                <p className="font-sans text-[11px] text-muted-foreground/70">
                  Included in your free plan
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
                <div className="flex flex-col items-center gap-3 border border-border bg-card p-6 text-center shadow-lg rounded-xl">
                  <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 mb-2">
                    <IconSparkles className="size-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Out of Generation Credits</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    You've hit the limit for your free generation tier. Upgrade to Pro to add more hours.
                  </p>
                  <Link href="/app/billing">
                    <Button variant="default" className="w-full sm:w-auto shadow-lg shadow-primary/20">
                      Upgrade to Pro
                    </Button>
                  </Link>
                </div>
              ) : null}

              {!fitsCurrentBalance && localMediaDuration && canGenerate ? (
                <div className="flex flex-col items-center gap-3 border border-amber-500/20 bg-amber-500/5 p-6 text-center shadow-lg rounded-xl">
                  <h3 className="text-base font-bold text-amber-500">Video Too Long</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    This file requires roughly {formatDuration(localMediaDuration)} of credits,
                    but you only have {formatCreditBalance(remainingSeconds)} left.
                  </p>
                  <Link href="/app/billing">
                    <Button variant="default" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20">
                      Top Up Credits
                    </Button>
                  </Link>
                </div>
              ) : null}

              {appState !== "idle" ? (
                <div className="space-y-6 border border-border/50 bg-card p-6 shadow-sm animate-fade-in-up">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground">
                      Configuration
                    </p>
                    <p className="font-sans text-sm text-muted-foreground/80">
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

                  {isVideo ? (
                    <div className="space-y-3 border border-border/50 bg-background/50 p-5 shadow-inner">
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Video Processing Mode
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label
                          className={`flex cursor-pointer flex-col gap-1 border px-4 py-3 text-sm transition-all ${localMode === "none" ? "border-primary bg-primary/5 text-primary shadow-[0_0_10px_rgba(255,180,60,0.1)] ring-1 ring-primary/30" : "border-border/50 hover:border-border hover:bg-card text-muted-foreground"}`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="local-mode"
                              value="none"
                              className="accent-primary"
                              checked={localMode === "none"}
                              disabled={isProcessing}
                              onChange={() => setLocalMode("none")}
                            />
                            <span className="font-medium">Upload Original</span>
                          </div>
                          <span className="text-[10px] pl-5 opacity-80">Fastest upload if file is small.</span>
                        </label>
                        <label
                          className={`flex cursor-pointer flex-col gap-1 border px-4 py-3 text-sm transition-all ${localMode === "extract" ? "border-primary bg-primary/5 text-primary shadow-[0_0_10px_rgba(255,180,60,0.1)] ring-1 ring-primary/30" : "border-border/50 hover:border-border hover:bg-card text-muted-foreground"}`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="local-mode"
                              value="extract"
                              className="accent-primary"
                              checked={localMode === "extract"}
                              disabled={isProcessing}
                              onChange={() => setLocalMode("extract")}
                            />
                            <span className="font-medium">Audio Only</span>
                          </div>
                          <span className="text-[10px] pl-5 opacity-80 text-green-500">Recommended. No crashes.</span>
                        </label>
                        <label
                          className={`flex cursor-pointer flex-col gap-1 border px-4 py-3 text-sm transition-all ${
                            fileExceedsLimit 
                              ? "opacity-50 cursor-not-allowed border-border/50 bg-muted/20" 
                              : localMode === "compress" 
                                ? "border-primary bg-primary/5 text-primary shadow-[0_0_10px_rgba(255,180,60,0.1)] ring-1 ring-primary/30" 
                                : "border-border/50 hover:border-border hover:bg-card text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="local-mode"
                              value="compress"
                              className="accent-primary"
                              checked={localMode === "compress"}
                              disabled={isProcessing || fileExceedsLimit}
                              onChange={() => setLocalMode("compress")}
                            />
                            <span className="font-medium">Compress Video</span>
                          </div>
                          <span className="text-[10px] pl-5 opacity-80">
                            {fileExceedsLimit ? "Disabled > 500MB" : "Shrink file locally"}
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : null}

                  <details
                    className="group border border-border/50 bg-background/50 p-5 shadow-inner marker:text-primary transition-colors hover:border-border"
                    open
                  >
                    <summary className="cursor-pointer font-sans text-sm font-semibold tracking-wide text-foreground group-open:text-primary transition-colors">
                      Advanced settings
                    </summary>
                    <div className="mt-5 space-y-6 font-sans">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs tracking-wider">
                          <label htmlFor="max-words" className="text-muted-foreground uppercase">
                            Words per block
                          </label>
                          <span className="font-mono text-primary font-bold">
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

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs tracking-wider">
                          <label htmlFor="max-duration" className="text-muted-foreground uppercase">
                            Max block duration
                          </label>
                          <span className="font-mono text-primary font-bold">
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
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Output mode</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {MODE_OPTIONS.map((option) => (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-all ${settings.mode === option.value ? "border-primary bg-primary/5 text-primary shadow-[0_0_10px_rgba(255,180,60,0.1)] ring-1 ring-primary/30" : "border-border/50 hover:border-border hover:bg-card text-muted-foreground"}`}
                            >
                              <input
                                type="radio"
                                name="output-mode"
                                value={option.value}
                                className="accent-primary"
                                checked={settings.mode === option.value}
                                disabled={isProcessing}
                                onChange={() =>
                                  setSettings((current) => ({
                                    ...current,
                                    mode: option.value,
                                  }))
                                }
                              />
                              <span className="font-medium">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="flex flex-col gap-4 sm:flex-row pt-2">
                    <Button
                      type="button"
                      size="lg"
                      className="flex-1 shadow-[0_0_20px_rgba(255,180,60,0.15)] hover:shadow-[0_0_30px_rgba(255,180,60,0.3)] transition-all font-semibold tracking-wide"
                      onClick={handleSubmit}
                      disabled={
                        !file ||
                        isProcessing ||
                        !canGenerate ||
                        !fitsCurrentBalance
                      }
                    >
                      Generate Captions
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="flex-none border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      onClick={handleReset}
                      disabled={isProcessing}
                    >
                      <IconRefresh className="size-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              <ProgressTracker job={job} />

              {appState === "done" ? (
                <section className="space-y-6 border border-border/50 bg-card p-6 shadow-sm animate-fade-in-up">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                        <IconCircleCheck className="size-5 text-primary" />
                      </div>
                      <p className="font-sans text-lg font-semibold tracking-wide text-foreground drop-shadow-sm">
                        Captions Generated Successfully
                      </p>
                    </div>
                    <p className="font-sans text-sm leading-relaxed text-muted-foreground/80 pl-11">
                      Review the generated subtitle blocks, verify synchronization,
                      and download or copy the final SRT output.
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

                  <div className="space-y-3 border border-border/50 bg-background/50 p-5 backdrop-blur-sm">
                    <p className="font-sans text-sm font-semibold tracking-wide text-foreground">Caption Quality Report</p>
                    <div className="space-y-1.5 mt-2">
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
                        text={`SRT duration differs from audio length by ${(syncDiscrepancy * 100).toFixed(1)}%, check for sync drift.`}
                      />
                      <WarningLine
                        show={!validation.valid}
                        text={validation.errors.join(" ")}
                      />
                      <WarningLine
                        show={usedChunking}
                        text="Long media handling was applied automatically for reliable performance."
                        tone="neutral"
                      />
                      {shortBlockCount === 0 &&
                      longBlockCount === 0 &&
                      syncDiscrepancy <= 0.05 &&
                      validation.valid && 
                      !usedChunking ? (
                        <p className="font-mono text-xs text-primary/70 uppercase tracking-widest mt-2 flex items-center gap-2">
                          <span className="inline-block size-1.5 rounded-full bg-primary"></span>
                          No quality warnings detected
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <SRTPreview value={preview} />

                  <div className="flex flex-col gap-4 sm:flex-row pt-4">
                    <DownloadButton
                      content={job.srtContent ?? preview}
                      filename={downloadName}
                      disabled={job.status !== "done"}
                      className="flex-1 shadow-[0_0_15px_rgba(255,180,60,0.1)] transition-shadow hover:shadow-[0_0_25px_rgba(255,180,60,0.25)] font-semibold tracking-wide"
                    />
                    {savedTranscriptionId && (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="flex-1 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-sm font-semibold tracking-wide"
                        onClick={() => router.push(`/app/transcriptions/${savedTranscriptionId}`)}
                      >
                        <IconPencil className="size-4" />
                        Edit Captions
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="flex-1 border-border/50 hover:bg-background hover:text-primary transition-all shadow-sm"
                      onClick={handleCopy}
                      disabled={!preview}
                    >
                      <IconCopy className="size-4" />
                      {copied ? "Copied to Clipboard" : "Copy SRT"}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="flex-none border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
                      onClick={handleReset}
                    >
                      <IconRefresh className="size-4" />
                      Reset
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
    <div className="space-y-3 border border-border/50 bg-card p-5 shadow-sm transition-colors hover:border-primary/30 group">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-primary/80 transition-colors">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-heading text-2xl font-light text-foreground break-words">{value}</p>
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
    <div className="space-y-4 border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-lg group">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-primary/80 transition-colors">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-heading text-3xl font-light text-foreground drop-shadow-sm">{value}</p>
      <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/80">{detail}</p>
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
    <p className="flex items-start gap-2 font-mono text-[10px] leading-relaxed uppercase tracking-widest group">
      <span className={tone === "warning" ? "text-yellow-500 font-bold" : "text-muted-foreground/50"}>
        &gt;
      </span>
      <span
        className={
          tone === "warning"
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-muted-foreground"
        }
      >
        {tone === "warning" ? "WARNING: " : ""}
        {text}
      </span>
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
