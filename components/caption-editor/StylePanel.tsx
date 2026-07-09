"use client"

import * as React from "react"
import {
  IconBolt,
  IconArrowUp,
  IconLetterT,
  IconCircle,
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandX,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconSquare,
  IconMicrophone2,
  IconSparkles,
  IconFlame,
  IconAdjustments,
  IconStars,
  IconAlignCenter,
  IconPlayerTrackNext,
  IconShadow,
} from "@tabler/icons-react"
import { Slider } from "@/components/ui/slider"
import type {
  AnimationPreset,
  BackgroundStyle,
  CaptionPosition,
  CaptionStyle,
  TextPreset,
  VideoFormat,
} from "@/types"

/* ─── Video format presets ─────────────────────────────────────────────────── */

export const VIDEO_FORMATS: VideoFormat[] = [
  { id: "youtube",         label: "YouTube",     sublabel: "16:9", width: 1920, height: 1080 },
  { id: "youtube-shorts",  label: "YT Shorts",   sublabel: "9:16", width: 1080, height: 1920 },
  { id: "instagram-reel",  label: "IG Reel",     sublabel: "9:16", width: 1080, height: 1920 },
  { id: "instagram-post",  label: "IG Post",     sublabel: "1:1",  width: 1080, height: 1080 },
  { id: "instagram-story", label: "IG Story",    sublabel: "9:16", width: 1080, height: 1920 },
  { id: "tiktok",          label: "TikTok",      sublabel: "9:16", width: 1080, height: 1920 },
  { id: "twitter",         label: "X / Twitter", sublabel: "16:9", width: 1280, height: 720  },
  { id: "custom-169",      label: "Landscape",   sublabel: "16:9", width: 1920, height: 1080 },
  { id: "custom-916",      label: "Portrait",    sublabel: "9:16", width: 1080, height: 1920 },
  { id: "custom-11",       label: "Square",      sublabel: "1:1",  width: 1080, height: 1080 },
  { id: "custom-45",       label: "4:5",         sublabel: "4:5",  width: 1080, height: 1350 },
  { id: "custom-219",      label: "Cinematic",   sublabel: "21:9", width: 2560, height: 1080 },
]

const FORMAT_ICON: Record<string, React.ReactNode> = {
  "youtube":         <IconBrandYoutube className="size-3.5" />,
  "youtube-shorts":  <IconBrandYoutube className="size-3.5" />,
  "instagram-reel":  <IconBrandInstagram className="size-3.5" />,
  "instagram-post":  <IconBrandInstagram className="size-3.5" />,
  "instagram-story": <IconBrandInstagram className="size-3.5" />,
  "tiktok":          <IconBrandTiktok className="size-3.5" />,
  "twitter":         <IconBrandX className="size-3.5" />,
  "custom-169":      <IconDeviceDesktop className="size-3.5" />,
  "custom-916":      <IconDeviceMobile className="size-3.5" />,
  "custom-11":       <IconSquare className="size-3.5" />,
  "custom-45":       <IconDeviceMobile className="size-3.5" />,
  "custom-219":      <IconDeviceDesktop className="size-3.5" />,
}

/* ─── Text / caption presets ───────────────────────────────────────────────── */

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    tag: "Classic",
    style: { animation: "fade", position: "bottom", fontSize: 28, textColor: "#ffffff", background: "none" },
  },
  {
    id: "bold-block",
    name: "Bold Block",
    tag: "Punchy",
    style: { animation: "pop", position: "bottom", fontSize: 42, textColor: "#ffffff", background: "solid" },
  },
  {
    id: "neon",
    name: "Neon",
    tag: "Trendy",
    style: { animation: "fade", position: "bottom", fontSize: 36, textColor: "#FFE600", background: "none" },
  },
  {
    id: "story",
    name: "Story",
    tag: "Social",
    style: { animation: "slide-up", position: "middle", fontSize: 48, textColor: "#ffffff", background: "none" },
  },
  {
    id: "karaoke",
    name: "Karaoke",
    tag: "Synced",
    style: { animation: "word-by-word", position: "bottom", fontSize: 36, textColor: "#FFE600", background: "semi" },
  },
  {
    id: "viral",
    name: "Viral",
    tag: "Hot",
    style: { animation: "bounce", position: "bottom", fontSize: 40, textColor: "#FF6B35", background: "solid" },
  },
  {
    id: "aesthetic",
    name: "Aesthetic",
    tag: "Blur",
    style: { animation: "blur", position: "middle", fontSize: 36, textColor: "#ffffff", background: "none" },
  },
  {
    id: "minimal",
    name: "Minimal",
    tag: "Clean",
    style: { animation: "none", position: "bottom", fontSize: 24, textColor: "#ffffff", background: "none" },
  },
  {
    id: "word-flash",
    name: "Word Flash",
    tag: "Dynamic",
    style: { animation: "word-by-word", position: "middle", fontSize: 56, textColor: "#ffffff", background: "none" },
  },
]

const PRESET_ICON: Record<string, React.ReactNode> = {
  "cinematic":   <IconShadow className="size-3.5" />,
  "bold-block":  <IconBolt className="size-3.5" />,
  "neon":        <IconSparkles className="size-3.5" />,
  "story":       <IconDeviceMobile className="size-3.5" />,
  "karaoke":     <IconMicrophone2 className="size-3.5" />,
  "viral":       <IconFlame className="size-3.5" />,
  "aesthetic":   <IconStars className="size-3.5" />,
  "minimal":     <IconAlignCenter className="size-3.5" />,
  "word-flash":  <IconPlayerTrackNext className="size-3.5" />,
}

/* ─── Component ────────────────────────────────────────────────────────────── */

interface StylePanelProps {
  style: CaptionStyle
  format: VideoFormat
  onChange: (s: CaptionStyle) => void
  onFormatChange: (f: VideoFormat) => void
}

export function StylePanel({ style, format, onChange, onFormatChange }: StylePanelProps) {
  const [tab, setTab] = React.useState<"presets" | "style" | "format">("presets")

  const update = <K extends keyof CaptionStyle>(key: K, value: CaptionStyle[K]) =>
    onChange({ ...style, [key]: value })

  const animations: Array<{ value: AnimationPreset; label: string; icon: React.ReactNode }> = [
    { value: "none",        label: "None",    icon: <span className="text-sm font-bold">—</span> },
    { value: "fade",        label: "Fade",    icon: <IconBolt className="size-4" /> },
    { value: "slide-up",    label: "Slide",   icon: <IconArrowUp className="size-4" /> },
    { value: "pop",         label: "Pop",     icon: <IconCircle className="size-4" /> },
    { value: "bounce",      label: "Bounce",  icon: <IconSparkles className="size-4" /> },
    { value: "blur",        label: "Blur",    icon: <IconShadow className="size-4" /> },
    { value: "typewriter",  label: "Type",    icon: <IconLetterT className="size-4" /> },
    { value: "word-by-word",label: "Words",   icon: <IconPlayerTrackNext className="size-4" /> },
  ]

  const positions: Array<{ value: CaptionPosition; label: string }> = [
    { value: "bottom", label: "Bottom" },
    { value: "middle", label: "Middle" },
    { value: "top",    label: "Top"    },
  ]

  const backgrounds: Array<{ value: BackgroundStyle; label: string }> = [
    { value: "none",  label: "None"  },
    { value: "semi",  label: "Semi"  },
    { value: "solid", label: "Solid" },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-border/30">
        {(["presets", "style", "format"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Presets tab ── */}
        {tab === "presets" && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-[10px] text-muted-foreground/60">
              Click a preset to apply all style settings at once.
            </p>
            {TEXT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onChange(preset.style)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  style.animation === preset.style.animation &&
                  style.fontSize === preset.style.fontSize &&
                  style.textColor === preset.style.textColor
                    ? "border-primary bg-primary/10"
                    : "border-border/40 bg-card hover:border-primary/30"
                }`}
              >
                {/* Mini preview swatch */}
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                  style={{
                    background: preset.style.background === "none" ? "#111" : preset.style.background === "semi" ? "rgba(0,0,0,0.6)" : "#000",
                    color: preset.style.textColor,
                    border: `1px solid ${preset.style.textColor}22`,
                  }}
                >
                  Aa
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {PRESET_ICON[preset.id]}
                    <span className="text-sm font-semibold text-foreground">{preset.name}</span>
                    <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {preset.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {preset.style.animation} · {preset.style.position} · {preset.style.fontSize}px
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Style tab ── */}
        {tab === "style" && (
          <div className="flex flex-col gap-6">
            {/* Animation */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Animation</p>
              <div className="grid grid-cols-4 gap-2">
                {animations.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => update("animation", a.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-[10px] font-medium transition-colors ${
                      style.animation === a.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>
              {style.animation === "word-by-word" && (
                <p className="mt-2 text-[10px] text-primary/70">
                  Words appear one at a time, timed to the segment duration.
                </p>
              )}
            </div>

            {/* Position */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Position</p>
              <div className="flex gap-2">
                {positions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => update("position", p.value)}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                      style.position === p.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Font Size</p>
                <span className="font-mono text-xs text-foreground">{style.fontSize}px</span>
              </div>
              <Slider
                min={18}
                max={96}
                step={2}
                value={[style.fontSize]}
                onValueChange={([v]) => update("fontSize", v)}
                className="w-full"
              />
            </div>

            {/* Text Color */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Text Color</p>
              <div className="flex flex-wrap gap-2">
                {["#ffffff", "#FFE600", "#FF6B35", "#00E5FF", "#FF3CAC", "#39FF14", "#FF0000"].map((c) => (
                  <button
                    key={c}
                    onClick={() => update("textColor", c)}
                    className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      style.textColor === c ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
                <div
                  className="size-7 rounded-full border-2 border-border/50 overflow-hidden"
                  style={{ background: style.textColor }}
                  title="Custom color"
                >
                  <input
                    type="color"
                    value={style.textColor}
                    onChange={(e) => update("textColor", e.target.value)}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="self-center font-mono text-xs text-muted-foreground">{style.textColor}</span>
              </div>
            </div>

            {/* Background */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Background</p>
              <div className="flex gap-2">
                {backgrounds.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => update("background", b.value)}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                      style.background === b.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Format tab ── */}
        {tab === "format" && (
          <div>
            <p className="mb-3 text-[10px] text-muted-foreground/60">
              Sets the output canvas size. Video is letterboxed/pillarboxed to fit.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {VIDEO_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFormatChange(f)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2.5 text-center transition-colors ${
                    format.id === f.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {FORMAT_ICON[f.id]}
                  <span className="text-[10px] font-semibold leading-none">{f.label}</span>
                  <span className="text-[9px] leading-none opacity-60">{f.sublabel}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-md border border-border/30 bg-card/50 px-3 py-2 font-mono text-[10px] text-muted-foreground">
              {format.width} × {format.height} px · {format.sublabel}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
