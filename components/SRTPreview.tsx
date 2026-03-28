import { parseSRTContent, validateSRT } from "@/lib/srt"

type SRTPreviewProps = {
  value: string
}

export function SRTPreview({ value }: SRTPreviewProps) {
  if (!value) {
    return (
      <div className="space-y-4 border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground">
            SRT Output
          </p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Awaiting Source
          </span>
        </div>
        <div className="border border-border/50 bg-background/50 p-6 font-mono text-sm text-muted-foreground shadow-inner">
          // No subtitle output yet.
        </div>
      </div>
    )
  }

  const blocks = parseSRTContent(value)
  const validation = validateSRT(value)
  const totalDuration =
    blocks.length > 0 ? blocks[blocks.length - 1].endSeconds : 0

  return (
    <div className="space-y-5 border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground">
            Generated SRT
          </p>
          <p className="font-heading mt-3 text-xl font-medium text-primary">
            {blocks.length}{" "}
            <span className="font-sans text-sm font-normal tracking-tight text-muted-foreground">
              blocks across {formatPreviewDuration(totalDuration)}
            </span>
          </p>
        </div>
        <span
          className={
            validation.valid
              ? "font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              : "font-mono text-[10px] font-semibold uppercase tracking-widest text-destructive shadow-destructive/20 drop-shadow-md"
          }
        >
          {validation.valid ? "Validation Passed" : "Validation Issues"}
        </span>
      </div>

      {validation.errors.length > 0 ? (
        <div className="space-y-1.5 border border-destructive/30 bg-destructive/5 p-4 font-mono text-[10px] uppercase tracking-wider text-destructive">
          {validation.errors.map((error) => (
            <p key={error} className="flex gap-2"><span className="opacity-50">&gt;</span> {error}</p>
          ))}
        </div>
      ) : null}

      <div className="max-h-96 space-y-4 overflow-auto border border-border/50 bg-background/80 p-4 shadow-inner">
        {blocks.map((block) => {
          const toneClass =
            block.durationSeconds > 7
              ? "border-destructive/40 bg-destructive/5"
              : block.durationSeconds < 1
                ? "border-yellow-500/40 bg-yellow-500/5"
                : "border-border/60 bg-card hover:border-primary/40 transition-colors duration-300"

          return (
            <article
              key={`${block.index}-${block.startTime}`}
              className={`space-y-3 border p-4 shadow-sm backdrop-blur-sm ${toneClass}`}
            >
              <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="text-primary/70">
                  [{String(block.index).padStart(3, "0")}]
                </span>
                <span>
                  {block.startTime} <span className="mx-2 opacity-40">⟶</span>{" "}
                  {block.endTime}
                </span>
              </div>
              <p className="font-sans text-sm leading-relaxed text-foreground/90">
                {block.text}
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function formatPreviewDuration(seconds: number) {
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
