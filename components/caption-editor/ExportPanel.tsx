"use client"

import * as React from "react"
import { IconDownload, IconVideo, IconFileTypography, IconDeviceFloppy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { segmentsToSRT, segmentsToVTT } from "@/lib/srt"
import { exportVideoWithCaptions } from "@/lib/ffmpeg-export"
import type { CaptionStyle, EditorCaptionSegment, VideoFormat } from "@/types"

interface ExportPanelProps {
  segments: EditorCaptionSegment[]
  style: CaptionStyle
  format: VideoFormat
  videoFile: File | null
  filename: string
  onSave: () => Promise<void>
  isSaving: boolean
}

export function ExportPanel({ segments, style, format, videoFile, filename, onSave, isSaving }: ExportPanelProps) {
  const [exportProgress, setExportProgress] = React.useState<number | null>(null)
  const [exportError, setExportError] = React.useState<string | null>(null)
  const baseName = filename.replace(/\.[^.]+$/, "")

  const downloadBlob = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleExportVideo = async () => {
    if (!videoFile) return
    setExportError(null)
    setExportProgress(0)
    try {
      await exportVideoWithCaptions({
        videoFile,
        segments,
        style,
        format,
        onProgress: setExportProgress,
      })
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExportProgress(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border/30 bg-card/50 px-4 py-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={isSaving}
        className="border-border/50 hover:bg-primary/10 hover:text-primary"
      >
        <IconDeviceFloppy className="size-4" />
        {isSaving ? "Saving…" : "Save Changes"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadBlob(segmentsToSRT(segments), `${baseName}_captions.srt`, "text/plain")}
        className="border-border/50 hover:bg-primary/10 hover:text-primary"
      >
        <IconFileTypography className="size-4" />
        Download SRT
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadBlob(segmentsToVTT(segments), `${baseName}_captions.vtt`, "text/vtt")}
        className="border-border/50 hover:bg-primary/10 hover:text-primary"
      >
        <IconDownload className="size-4" />
        Download VTT
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportVideo}
        disabled={!videoFile || exportProgress !== null}
        title={!videoFile ? "Load a video first to export" : `Export ${format.width}×${format.height} MP4 with burned-in captions`}
        className="border-border/50 hover:bg-primary/10 hover:text-primary disabled:opacity-40"
      >
        <IconVideo className="size-4" />
        {exportProgress !== null
          ? `Exporting ${exportProgress}%…`
          : `Export MP4 (${format.sublabel})`}
      </Button>

      {exportProgress !== null && (
        <div className="w-40">
          <Progress value={exportProgress} className="h-1.5" />
        </div>
      )}

      {exportError && (
        <p className="text-xs text-destructive">{exportError}</p>
      )}
    </div>
  )
}
