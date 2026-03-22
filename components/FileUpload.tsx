"use client"

import {
  IconFileMusic,
  IconMovie,
  IconRefresh,
  IconUpload,
} from "@tabler/icons-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

type FileUploadProps = {
  file: File | null
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

export function FileUpload({
  file,
  onFileChange,
  disabled = false,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const fileTypeLabel = getFileTypeLabel(file)
  const isLargeFile = (file?.size ?? 0) > 500 * 1024 * 1024

  const handleFileSelection = (nextFile: File | null) => {
    onFileChange(nextFile)
    setIsDragging(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Upload
        </label>
        <span className="text-xs text-muted-foreground">
          MP4, MOV, WAV, MP3, M4A, WebM
        </span>
      </div>

      <button
        type="button"
        className={`flex min-h-56 w-full flex-col items-center justify-center gap-4 border-2 border-dashed px-6 py-8 text-left transition ${
          isDragging
            ? "border-foreground bg-muted/50"
            : "border-border bg-card hover:border-foreground/30 hover:bg-muted/40"
        } disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return
          }
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          handleFileSelection(event.dataTransfer.files?.[0] ?? null)
        }}
        disabled={disabled}
      >
        <span className="flex size-14 items-center justify-center border border-border bg-background">
          {file?.type.startsWith("video/") ? (
            <IconMovie className="size-6" />
          ) : file ? (
            <IconFileMusic className="size-6" />
          ) : (
            <IconUpload className="size-6" />
          )}
        </span>

        <div className="space-y-2 text-center">
          <p className="text-base font-medium">
            {file ? file.name : "Drag and drop your file or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">
            {file
              ? `${formatFileSize(file.size)} • ${fileTypeLabel}`
              : "Fast upload for audio and video transcription."}
          </p>
          {!file ? (
            <p className="text-xs text-muted-foreground">
              Your file is processed securely through the server.
            </p>
          ) : null}
        </div>
      </button>

      {file ? (
        <div className="space-y-3 border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {fileTypeLabel} • {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                handleFileSelection(null)
                if (inputRef.current) {
                  inputRef.current.value = ""
                }
              }}
              disabled={disabled}
            >
              <IconRefresh className="size-4" />
              Clear
            </Button>
          </div>

          {isLargeFile ? (
            <p className="border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-700 dark:text-yellow-300">
              Files over 500 MB will be slower to process. Compressing first can help.
            </p>
          ) : null}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
      />
    </div>
  )
}

function getFileTypeLabel(file: File | null) {
  if (!file) {
    return "No file selected"
  }

  return file.type.startsWith("video/") ? "Video" : "Audio"
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
