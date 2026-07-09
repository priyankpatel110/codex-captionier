"use client"

import * as React from "react"
import { IconUpload, IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react"
import type { CaptionStyle, EditorCaptionSegment, VideoFormat } from "@/types"

interface VideoPlayerProps {
  videoFile: File | null
  segments: EditorCaptionSegment[]
  style: CaptionStyle
  format: VideoFormat
  currentTimeSeconds: number
  onTimeUpdate: (t: number) => void
  onVideoLoad: (file: File) => void
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export function VideoPlayer({
  videoFile,
  segments,
  style,
  format,
  currentTimeSeconds,
  onTimeUpdate,
  onVideoLoad,
  videoRef,
}: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const [duration, setDuration] = React.useState(0)
  // High-frequency time for word-by-word (driven by rAF)
  const [fineTime, setFineTime] = React.useState(0)
  const rafRef = React.useRef<number>(0)
  const progressRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!videoFile) { setVideoUrl(null); return }
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  // rAF loop for word-by-word smooth sync (only runs when playing)
  React.useEffect(() => {
    if (style.animation !== "word-by-word") {
      cancelAnimationFrame(rafRef.current)
      return
    }
    const tick = () => {
      const t = videoRef.current?.currentTime ?? 0
      setFineTime(t)
      rafRef.current = requestAnimationFrame(tick)
    }
    if (playing) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      setFineTime(videoRef.current?.currentTime ?? currentTimeSeconds)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [style.animation, playing, videoRef, currentTimeSeconds])

  const activeTime = style.animation === "word-by-word" ? fineTime : currentTimeSeconds

  const activeSegment = React.useMemo(
    () => segments.find((s) => activeTime >= s.startSeconds && activeTime < s.endSeconds),
    [segments, activeTime]
  )

  const positionClass =
    style.position === "bottom" ? "bottom-[8%]" :
    style.position === "top"    ? "top-[8%]"    :
    "top-1/2 -translate-y-1/2"

  const bgClass =
    style.background === "none"  ? "" :
    style.background === "semi"  ? "bg-black/60 px-3 py-1.5 rounded-md" :
    "bg-black px-3 py-1.5 rounded-md"

  const handleTogglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) { vid.play(); setPlaying(true) }
    else { vid.pause(); setPlaying(false) }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current
    if (!vid) return
    const t = Number(e.target.value)
    vid.currentTime = t
    setFineTime(t)
    onTimeUpdate(t)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onVideoLoad(f)
  }

  const aspectRatio = format.width / format.height
  const isPortrait = aspectRatio < 1

  if (!videoUrl) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 gap-4"
        style={{ aspectRatio: `${format.width}/${format.height}`, maxHeight: isPortrait ? "70vh" : undefined }}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <IconUpload className="size-6 text-primary" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-medium text-foreground">Load video to preview captions</p>
          <p className="mt-1 text-xs text-muted-foreground">Required for preview and export</p>
        </div>
        <label className="cursor-pointer rounded-md border border-border/50 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary">
          Choose Video File
          <input type="file" accept="video/*,audio/*" className="sr-only" onChange={handleFileInput} />
        </label>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl bg-black"
        style={{
          aspectRatio: `${format.width}/${format.height}`,
          maxHeight: isPortrait ? "68vh" : undefined,
          maxWidth: isPortrait ? `calc(68vh * ${aspectRatio})` : undefined,
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={() => {
            const t = videoRef.current?.currentTime ?? 0
            onTimeUpdate(t)
          }}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        {activeSegment && (
          <div className={`absolute left-0 right-0 flex justify-center ${positionClass} pointer-events-none px-4`}>
            {style.animation === "word-by-word"
              ? <WordByWordCaption
                  segment={activeSegment}
                  currentTime={fineTime}
                  style={style}
                  bgClass={bgClass}
                />
              : <StaticCaption
                  segment={activeSegment}
                  style={style}
                  bgClass={bgClass}
                />
            }
          </div>
        )}

        {/* Format badge */}
        <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/60">
          {format.sublabel}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTogglePlay}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
        >
          {playing ? <IconPlayerPause className="size-4" /> : <IconPlayerPlay className="size-4" />}
        </button>
        <input
          ref={progressRef}
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTimeSeconds}
          onChange={handleSeek}
          className="w-full h-1 rounded-full appearance-none bg-border/50 accent-primary cursor-pointer"
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {fmt(currentTimeSeconds)} / {fmt(duration)}
        </span>
      </div>
    </div>
  )
}

/* ─── Static caption (all animations except word-by-word) ──────────────────── */
function StaticCaption({
  segment,
  style,
  bgClass,
}: {
  segment: EditorCaptionSegment
  style: CaptionStyle
  bgClass: string
}) {
  const animClass =
    style.animation === "fade"       ? "caption-fade"       :
    style.animation === "slide-up"   ? "caption-slide-up"   :
    style.animation === "pop"        ? "caption-pop"        :
    style.animation === "bounce"     ? "caption-bounce"     :
    style.animation === "blur"       ? "caption-blur"       :
    style.animation === "typewriter" ? "caption-typewriter" :
    ""

  return (
    <span
      key={segment.id}
      className={`${animClass} ${bgClass} text-center leading-snug`}
      style={{
        color: style.textColor,
        fontSize: `${style.fontSize}px`,
        textShadow: "0 1px 4px rgba(0,0,0,0.85)",
      }}
    >
      {segment.text}
    </span>
  )
}

/* ─── Word-by-word caption ─────────────────────────────────────────────────── */
function WordByWordCaption({
  segment,
  currentTime,
  style,
  bgClass,
}: {
  segment: EditorCaptionSegment
  currentTime: number
  style: CaptionStyle
  bgClass: string
}) {
  const words = segment.text.split(" ")
  const elapsed = currentTime - segment.startSeconds
  const duration = Math.max(0.001, segment.endSeconds - segment.startSeconds)
  // How many words should be visible (at least 1 when segment starts)
  const visibleCount = Math.max(1, Math.ceil((elapsed / duration) * words.length))

  return (
    <span
      className={`${bgClass} text-center leading-snug`}
      style={{ color: style.textColor, fontSize: `${style.fontSize}px`, textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}
    >
      {words.map((word, i) => (
        <WordToken
          key={`${segment.id}-${i}`}
          word={word}
          visible={i < visibleCount}
          isNew={i === visibleCount - 1}
          revealIndex={i}
        />
      ))}
    </span>
  )
}

function WordToken({
  word,
  visible,
  isNew,
  revealIndex,
}: {
  word: string
  visible: boolean
  isNew: boolean
  revealIndex: number
}) {
  // Use a counter key so the animation replays every time this word becomes the "new" word
  const [animKey, setAnimKey] = React.useState(0)
  const prevIsNew = React.useRef(false)

  React.useEffect(() => {
    if (isNew && !prevIsNew.current) setAnimKey((k) => k + 1)
    prevIsNew.current = isNew
  }, [isNew])

  return (
    <span
      key={animKey}
      style={{
        display: "inline-block",
        opacity: visible ? 1 : 0,
        animation: visible && animKey > 0 ? "caption-word-pop 0.18s ease-out forwards" : undefined,
        marginRight: "0.25em",
      }}
    >
      {word}
    </span>
  )
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}
