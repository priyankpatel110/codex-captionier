import { parseSRTContent, validateSRT } from "@/lib/srt"

type SRTPreviewProps = {
  value: string
}

export function SRTPreview({ value }: SRTPreviewProps) {
  if (!value) {
    return (
      <div className="space-y-3 border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Captions
          </p>
          <span className="text-xs text-muted-foreground">No output yet</span>
        </div>
        <div className="border border-border bg-background p-4 text-sm text-muted-foreground">
          No subtitle output yet.
        </div>
      </div>
    )
  }

  const blocks = parseSRTContent(value)
  const validation = validateSRT(value)
  const totalDuration =
    blocks.length > 0 ? blocks[blocks.length - 1].endSeconds : 0

  return (
    <div className="space-y-4 border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Captions
          </p>
          <p className="mt-2 text-sm font-medium">
            {blocks.length} blocks across {formatPreviewDuration(totalDuration)}
          </p>
        </div>
        <span
          className={
            validation.valid
              ? "text-xs text-muted-foreground"
              : "text-xs text-destructive"
          }
        >
          {validation.valid ? "Validation passed" : "Validation issues found"}
        </span>
      </div>

      {validation.errors.length > 0 ? (
        <div className="space-y-1 border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {validation.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="max-h-96 space-y-3 overflow-auto border border-border bg-background p-3">
        {blocks.map((block) => {
          const toneClass =
            block.durationSeconds > 7
              ? "border-destructive/40 bg-destructive/10"
              : block.durationSeconds < 1
                ? "border-yellow-500/40 bg-yellow-500/10"
                : "border-border bg-card"

          return (
            <article
              key={`${block.index}-${block.startTime}`}
              className={`space-y-2 border p-3 ${toneClass}`}
            >
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>#{block.index}</span>
                <span>
                  {block.startTime} {"-->"} {block.endTime}
                </span>
              </div>
              <p className="text-sm leading-6">{block.text}</p>
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
