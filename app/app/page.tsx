"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link"
import { IconPlus, IconFileTime, IconClock, IconFileTypography, IconDownload, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const transcriptions = useQuery(api.transcriptions.getTranscriptions)
  const deleteTranscription = useMutation(api.transcriptions.deleteTranscription)

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this transcription?")) {
      try {
        await deleteTranscription({ id })
      } catch (error) {
        alert("Failed to delete transcription")
      }
    }
  }

  // Wait for loading
  if (transcriptions === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <IconFileTime className="size-8" />
          <p className="font-sans text-sm tracking-wide">Loading your conversions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 animate-fade-in-up">
      <div className="mb-8 flex items-end justify-between border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your past subtitle conversions</p>
        </div>
        <Link href="/app/new">
          <Button className="font-semibold tracking-wide shadow-[0_0_15px_rgba(255,180,60,0.1)] transition-shadow hover:shadow-[0_0_25px_rgba(255,180,60,0.25)]">
            <IconPlus className="mr-2 size-4" />
            New Caption
          </Button>
        </Link>
      </div>

      {transcriptions.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/50 px-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <IconFileTypography className="size-8 text-primary" />
          </div>
          <h2 className="font-heading text-xl font-medium tracking-tight">No conversions yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            You haven't generated any SRT files yet. Click the button below to get started with your first video or audio file.
          </p>
          <Link href="/app/new" className="mt-6">
            <Button variant="outline" className="border-border/50 hover:bg-background hover:text-primary transition-all">
              <IconPlus className="mr-2 size-4" />
              Create First Caption
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transcriptions.map((t) => (
            <div key={t._id} className="group flex flex-col justify-between rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ring-1 ring-inset ring-border/50">
                    <IconClock className="size-3" />
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  {t.language && (
                    <span className="text-xs font-medium text-foreground opacity-80">{t.language}</span>
                  )}
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="ml-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete transcription"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-sans text-base font-semibold leading-tight text-foreground line-clamp-2" title={t.filename}>
                    {t.filename}
                  </h3>
                  {t.duration && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Math.floor(t.duration / 60)}:{(Math.floor(t.duration % 60)).toString().padStart(2, '0')} min duration
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/30">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between hover:bg-primary/10 hover:text-primary transition-colors group-hover:bg-background"
                  onClick={() => {
                    const blob = new Blob([t.srtContent], { type: "text/plain" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    // Create an explicit download name replacing original extension if any.
                    const name = t.filename.replace(/\.[^/.]+$/, "") + "_captions.srt"
                    a.download = name
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                >
                  <span className="font-semibold tracking-wide text-xs">Download SRT</span>
                  <IconDownload className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
