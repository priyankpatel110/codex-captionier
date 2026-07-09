"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { IconArrowLeft } from "@tabler/icons-react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { parseSRTContent, parsedBlocksToSegments } from "@/lib/srt"
import { getVideo, storeVideo } from "@/lib/video-storage"
import type { CaptionStyle, EditorCaptionSegment, VideoFormat } from "@/types"
import { VideoPlayer } from "./VideoPlayer"
import { SegmentList } from "./SegmentList"
import { StylePanel, VIDEO_FORMATS } from "./StylePanel"
import { ExportPanel } from "./ExportPanel"

const DEFAULT_STYLE: CaptionStyle = {
  animation: "fade",
  position: "bottom",
  fontSize: 32,
  textColor: "#ffffff",
  background: "semi",
}

interface CaptionEditorProps {
  transcriptionId: string
}

export function CaptionEditor({ transcriptionId }: CaptionEditorProps) {
  const transcription = useQuery(api.transcriptions.getTranscription, {
    id: transcriptionId as Id<"transcriptions">,
  })
  const updateSRT = useMutation(api.transcriptions.updateSRT)

  const [segments, setSegments] = React.useState<EditorCaptionSegment[]>([])
  const [style, setStyle] = React.useState<CaptionStyle>(DEFAULT_STYLE)
  const [format, setFormat] = React.useState<VideoFormat>(VIDEO_FORMATS[0]) // default: YouTube 16:9
  const [currentTimeSeconds, setCurrentTimeSeconds] = React.useState(0)
  const [videoFile, setVideoFile] = React.useState<File | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null)

  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  // Initialize segments from Convex data
  React.useEffect(() => {
    if (!transcription?.srtContent) return
    const blocks = parseSRTContent(transcription.srtContent)
    setSegments(parsedBlocksToSegments(blocks))
  }, [transcription?.srtContent])

  // Try to load video from IndexedDB
  React.useEffect(() => {
    getVideo(transcriptionId).then((f) => {
      if (f) setVideoFile(f)
    }).catch(() => {})
  }, [transcriptionId])

  const activeSegmentId = React.useMemo(() => {
    return segments.find(
      (s) => currentTimeSeconds >= s.startSeconds && currentTimeSeconds < s.endSeconds
    )?.id ?? null
  }, [segments, currentTimeSeconds])

  const handleSegmentChange = React.useCallback(
    (id: number, field: "text" | "startSeconds" | "endSeconds", value: string | number) => {
      setSegments((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      )
    },
    []
  )

  const handleSeek = React.useCallback((seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime = seconds
    setCurrentTimeSeconds(seconds)
  }, [])

  const handleVideoLoad = async (file: File) => {
    setVideoFile(file)
    try {
      await storeVideo(transcriptionId, file)
    } catch {}
  }

  const handleSave = async () => {
    if (!transcription) return
    setIsSaving(true)
    setSaveMsg(null)
    try {
      const { segmentsToSRT } = await import("@/lib/srt")
      await updateSRT({
        id: transcriptionId as Id<"transcriptions">,
        srtContent: segmentsToSRT(segments),
      })
      setSaveMsg("Saved")
    } catch {
      setSaveMsg("Save failed")
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  if (transcription === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm animate-pulse">
        Loading editor…
      </div>
    )
  }

  if (transcription === null) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Transcription not found or access denied.</p>
        <Link href="/app" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border/30 bg-card/50 px-4 py-3">
        <Link
          href="/app"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          Dashboard
        </Link>
        <span className="text-border/50">|</span>
        <p className="truncate text-sm font-medium text-foreground">{transcription.filename}</p>
        <span className="ml-auto flex items-center gap-2">
          <span className="rounded border border-border/30 bg-background/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {format.sublabel} · {format.label}
          </span>
          {saveMsg && (
            <span className={`text-xs ${saveMsg === "Saved" ? "text-primary" : "text-destructive"}`}>
              {saveMsg}
            </span>
          )}
        </span>
      </div>

      {/* 3-panel layout */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[300px_1fr_280px]">
        {/* Left: Segment list */}
        <div className="hidden overflow-hidden border-r border-border/30 lg:flex lg:flex-col">
          <SegmentList
            segments={segments}
            activeSegmentId={activeSegmentId}
            onChange={handleSegmentChange}
            onSeek={handleSeek}
          />
        </div>

        {/* Center: Video preview */}
        <div className="flex flex-col gap-4 overflow-auto p-4">
          <VideoPlayer
            videoFile={videoFile}
            segments={segments}
            style={style}
            format={format}
            currentTimeSeconds={currentTimeSeconds}
            onTimeUpdate={setCurrentTimeSeconds}
            onVideoLoad={handleVideoLoad}
            videoRef={videoRef}
          />

          {/* Segment list for mobile */}
          <div className="lg:hidden">
            <SegmentList
              segments={segments}
              activeSegmentId={activeSegmentId}
              onChange={handleSegmentChange}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Right: Style panel */}
        <div className="hidden overflow-y-auto border-l border-border/30 lg:block">
          <div className="border-b border-border/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Style</p>
          </div>
          <StylePanel
            style={style}
            format={format}
            onChange={setStyle}
            onFormatChange={setFormat}
          />
        </div>
      </div>

      {/* Bottom: Export panel */}
      <ExportPanel
        segments={segments}
        style={style}
        format={format}
        videoFile={videoFile}
        filename={transcription.filename}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  )
}
