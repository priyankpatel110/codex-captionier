import type { CaptionStyle, EditorCaptionSegment, VideoFormat } from "@/types"

export interface ExportOptions {
  videoFile: File
  segments: EditorCaptionSegment[]
  style: CaptionStyle
  format: VideoFormat
  onProgress: (percent: number) => void
  onLog?: (msg: string) => void
}

declare global {
  interface Window {
    FFmpeg: { createFFmpeg: (opts: object) => FFmpegInstance; fetchFile: (input: File | string) => Promise<Uint8Array> }
  }
}

interface FFmpegInstance {
  load(): Promise<void>
  isLoaded(): boolean
  run(...args: string[]): Promise<void>
  FS(method: "writeFile", name: string, data: Uint8Array): void
  FS(method: "readFile", name: string): Uint8Array
  FS(method: "unlink", name: string): void
  on(event: "progress", cb: (p: { ratio: number }) => void): void
  on(event: "log", cb: (p: { message: string }) => void): void
  setLogger(cb: (p: { type: string; message: string }) => void): void
}

let ffmpegInstance: FFmpegInstance | null = null

async function loadFFmpeg(): Promise<FFmpegInstance> {
  if (ffmpegInstance) return ffmpegInstance

  if (!window.FFmpeg) {
    await loadScript("https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js")
  }

  const { createFFmpeg } = window.FFmpeg
  const ff = createFFmpeg({ log: false })
  await ff.load()
  ffmpegInstance = ff
  return ff
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement("script")
    s.src = src
    s.crossOrigin = "anonymous"
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

function hexToAssBGR(hex: string): string {
  const clean = hex.replace("#", "").padEnd(6, "0")
  const r = clean.slice(0, 2)
  const g = clean.slice(2, 4)
  const b = clean.slice(4, 6)
  return `&H00${b}${g}${r}`.toUpperCase()
}

function secondsToASSTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`
}

function buildASSContent(
  segments: EditorCaptionSegment[],
  style: CaptionStyle,
  format: VideoFormat
): string {
  const color = hexToAssBGR(style.textColor)
  const alignment = style.position === "bottom" ? 2 : style.position === "top" ? 8 : 5
  const borderStyle = style.background === "none" ? 1 : 3
  const backColor = style.background === "solid" ? "&H00000000" : style.background === "semi" ? "&H80000000" : "&H00000000"
  const shadow = style.background === "none" ? 2 : 0

  // Margin-V as percentage of output height so position is format-relative
  const marginV = Math.round(format.height * 0.05)

  const animTag =
    style.animation === "fade"     ? "{\\fad(350,200)}" :
    style.animation === "slide-up" ? "{\\fad(300,0)\\move(640,380,640,360)}" :
    style.animation === "pop"      ? "{\\fad(200,0)\\t(0,300,\\fscx0\\fscy0,\\fscx100\\fscy100)}" :
    style.animation === "bounce"   ? "{\\fad(100,0)\\t(0,250,\\fscx40\\fscy40,\\fscx115\\fscy115)\\t(250,400,\\fscx115\\fscy115,\\fscx95\\fscy95)\\t(400,500,\\fscx95\\fscy95,\\fscx100\\fscy100)}" :
    style.animation === "blur"     ? "{\\fad(450,0)}" :  // approximate: ASS has no native blur tag
    ""

  const scriptInfo = `[Script Info]
ScriptType: v4.00+
PlayResX: ${format.width}
PlayResY: ${format.height}
WrapStyle: 0

`

  const styles = `[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${style.fontSize},${color},&H00FFFFFF,&H00000000,${backColor},0,0,0,0,100,100,0,0,${borderStyle},2,${shadow},${alignment},10,10,${marginV},1

`

  const eventLines: string[] =
    style.animation === "typewriter" || style.animation === "word-by-word"
      ? buildWordEvents(segments, style.animation === "word-by-word")
      : segments.map((seg) => {
          const start = secondsToASSTime(seg.startSeconds)
          const end = secondsToASSTime(seg.endSeconds)
          return `Dialogue: 0,${start},${end},Default,,0,0,0,,${animTag}${seg.text}`
        })

  const events = `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${eventLines.join("\n")}
`

  return scriptInfo + styles + events
}

function buildWordEvents(segments: EditorCaptionSegment[], wordByWord: boolean): string[] {
  const lines: string[] = []
  for (const seg of segments) {
    const words = seg.text.split(" ")
    const segDuration = Math.max(0.001, seg.endSeconds - seg.startSeconds)
    const wordDuration = segDuration / Math.max(words.length, 1)
    for (let i = 0; i < words.length; i++) {
      const wordStart = seg.startSeconds + i * wordDuration
      const wordEnd = seg.endSeconds
      // word-by-word: show only this word; typewriter: cumulative text
      const text = wordByWord ? words[i] : words.slice(0, i + 1).join(" ")
      const fadeTag = wordByWord ? "{\\fad(80,0)}" : ""
      lines.push(
        `Dialogue: 0,${secondsToASSTime(wordStart)},${secondsToASSTime(wordEnd)},Default,,0,0,0,,${fadeTag}${text}`
      )
    }
  }
  return lines
}

function buildVideoFilter(format: VideoFormat): string {
  const W = format.width
  const H = format.height
  // scale to fit within W×H preserving aspect, then pad to exact W×H with black bars
  const scaleAndPad = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`
  return `${scaleAndPad},ass=captions.ass`
}

export async function exportVideoWithCaptions(opts: ExportOptions): Promise<void> {
  const { videoFile, segments, style, format, onProgress, onLog } = opts

  if (videoFile.size > 800 * 1024 * 1024) {
    throw new Error("Video is too large for in-browser export (max 800 MB). Try trimming the video first.")
  }

  onProgress(0)
  const ff = await loadFFmpeg()

  if (onLog) ff.setLogger(({ message }) => onLog(message))
  ff.on("progress", ({ ratio }) => onProgress(Math.min(99, Math.round(ratio * 100))))

  const ext = videoFile.name.split(".").pop() ?? "mp4"
  const inputName = `input.${ext}`
  const outputName = "output.mp4"

  onProgress(2)
  const inputData = new Uint8Array(await videoFile.arrayBuffer())
  ff.FS("writeFile", inputName, inputData)

  const assContent = buildASSContent(segments, style, format)
  ff.FS("writeFile", "captions.ass", new TextEncoder().encode(assContent))

  onProgress(5)
  await ff.run(
    "-i", inputName,
    "-vf", buildVideoFilter(format),
    "-c:a", "copy",
    "-preset", "ultrafast",
    outputName
  )

  const outputData = ff.FS("readFile", outputName)
  const copied = new Uint8Array(outputData.length)
  copied.set(outputData)
  const blob = new Blob([copied], { type: "video/mp4" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${videoFile.name.replace(/\.[^.]+$/, "")}_${format.sublabel.replace(":", "x")}_captioned.mp4`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  try {
    ff.FS("unlink", inputName)
    ff.FS("unlink", "captions.ass")
    ff.FS("unlink", outputName)
  } catch {}

  onProgress(100)
}
