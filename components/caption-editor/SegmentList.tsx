"use client"

import * as React from "react"
import type { EditorCaptionSegment } from "@/types"
import { secondsToSRTTimestamp } from "@/lib/srt"

interface SegmentListProps {
  segments: EditorCaptionSegment[]
  activeSegmentId: number | null
  onChange: (id: number, field: "text" | "startSeconds" | "endSeconds", value: string | number) => void
  onSeek: (seconds: number) => void
}

const SegmentRow = React.memo(function SegmentRow({
  segment,
  isActive,
  onChange,
  onSeek,
}: {
  segment: EditorCaptionSegment
  isActive: boolean
  onChange: SegmentListProps["onChange"]
  onSeek: SegmentListProps["onSeek"]
}) {
  const rowRef = React.useRef<HTMLLIElement>(null)

  React.useEffect(() => {
    if (isActive) {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [isActive])

  const handleTimeBlur = (field: "startSeconds" | "endSeconds", raw: string) => {
    const parsed = parseTimeInput(raw)
    if (parsed !== null) onChange(segment.id, field, parsed)
  }

  return (
    <li
      ref={rowRef}
      className={`group cursor-pointer rounded-lg border p-3 transition-colors ${
        isActive ? "border-primary/50 bg-primary/5" : "border-border/30 bg-card hover:border-border/60"
      }`}
      onClick={() => onSeek(segment.startSeconds)}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {segment.id}
        </span>
        <input
          type="text"
          defaultValue={secondsToSRTTimestamp(segment.startSeconds)}
          onBlur={(e) => handleTimeBlur("startSeconds", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-[105px] rounded border border-border/30 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground focus:border-primary/50 focus:outline-none"
          spellCheck={false}
        />
        <span className="text-[10px] text-muted-foreground/50">→</span>
        <input
          type="text"
          defaultValue={secondsToSRTTimestamp(segment.endSeconds)}
          onBlur={(e) => handleTimeBlur("endSeconds", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-[105px] rounded border border-border/30 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground focus:border-primary/50 focus:outline-none"
          spellCheck={false}
        />
      </div>
      <textarea
        value={segment.text}
        onChange={(e) => onChange(segment.id, "text", e.target.value)}
        onClick={(e) => e.stopPropagation()}
        rows={2}
        className="w-full resize-none rounded border border-border/30 bg-background/50 px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground/50 focus:border-primary/50 focus:outline-none"
        spellCheck={false}
      />
    </li>
  )
})

export function SegmentList({ segments, activeSegmentId, onChange, onSeek }: SegmentListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {segments.length} Captions
        </p>
      </div>
      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {segments.map((seg) => (
          <SegmentRow
            key={seg.id}
            segment={seg}
            isActive={activeSegmentId === seg.id}
            onChange={onChange}
            onSeek={onSeek}
          />
        ))}
      </ol>
    </div>
  )
}

function parseTimeInput(raw: string): number | null {
  const trimmed = raw.trim()
  // HH:MM:SS,mmm or HH:MM:SS.mmm
  const full = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/)
  if (full) {
    return Number(full[1]) * 3600 + Number(full[2]) * 60 + Number(full[3]) + Number(full[4]) / 1000
  }
  // MM:SS or MM:SS.mmm
  const short = trimmed.match(/^(\d{1,2}):(\d{2})(?:[,.](\d{1,3}))?$/)
  if (short) {
    return Number(short[1]) * 60 + Number(short[2]) + (short[3] ? Number(short[3].padEnd(3, "0")) / 1000 : 0)
  }
  // raw seconds
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : null
}
