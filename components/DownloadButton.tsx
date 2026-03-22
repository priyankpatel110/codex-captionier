"use client"

import { IconDownload } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

type DownloadButtonProps = {
  content: string
  filename: string
  disabled?: boolean
  label?: string
  className?: string
}

export function DownloadButton({
  content,
  filename,
  disabled = false,
  label = "Download .srt file",
  className,
}: DownloadButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "application/x-subrip" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleDownload}
      disabled={disabled || !content}
      className={className ?? "w-full"}
    >
      <IconDownload className="size-4" />
      {label}
    </Button>
  )
}
