import ffmpeg from "fluent-ffmpeg"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { extname, join } from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const TEMP_PREFIX = "captionier-"
const CHUNK_OVERLAP_SECONDS = 2
const DEFAULT_CHUNK_DURATION_SECONDS = 28
const CLEANUP_RETRY_DELAYS_MS = [100, 250, 500]

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export async function extractAudioFromVideo(
  videoBuffer: Buffer,
  inputMimeType: string
): Promise<Buffer> {
  const tempDirectory = await mkdtemp(join(tmpdir(), TEMP_PREFIX))
  const inputPath = join(
    tempDirectory,
    `input-video${extensionFromMimeType(inputMimeType, ".mp4")}`
  )
  const outputPath = join(tempDirectory, "extracted-audio.wav")

  try {
    await writeFile(inputPath, videoBuffer)
    await runFfmpegCommand(
      ffmpeg(inputPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .format("wav")
        .outputOptions(["-acodec pcm_s16le"])
        .save(outputPath)
    )

    return await readFile(outputPath)
  } finally {
    await cleanupTempDirectory(tempDirectory)
  }
}

export async function chunkAudioBuffer(
  audioBuffer: Buffer,
  chunkDurationSeconds = DEFAULT_CHUNK_DURATION_SECONDS
): Promise<Array<{ buffer: Buffer; startOffsetSeconds: number }>> {
  const tempDirectory = await mkdtemp(join(tmpdir(), TEMP_PREFIX))
  const inputPath = join(tempDirectory, "input-audio.bin")

  try {
    await writeFile(inputPath, audioBuffer)

    const durationSeconds = await getMediaDurationSeconds(inputPath)

    if (durationSeconds <= chunkDurationSeconds) {
      return [{ buffer: audioBuffer, startOffsetSeconds: 0 }]
    }

    const chunks: Array<{ buffer: Buffer; startOffsetSeconds: number }> = []
    const coreChunkDurationSeconds = Math.max(
      1,
      chunkDurationSeconds - CHUNK_OVERLAP_SECONDS * 2
    )
    let baseStart = 0
    let index = 0

    while (baseStart < durationSeconds) {
      const startOffsetSeconds =
        index === 0 ? 0 : Math.max(0, baseStart - CHUNK_OVERLAP_SECONDS)
      const baseEnd = Math.min(
        baseStart + coreChunkDurationSeconds,
        durationSeconds
      )
      const chunkEnd = Math.min(
        durationSeconds,
        baseEnd + CHUNK_OVERLAP_SECONDS
      )
      const chunkLength = chunkEnd - startOffsetSeconds
      const outputPath = join(tempDirectory, `chunk-${index}.wav`)

      await runFfmpegCommand(
        ffmpeg(inputPath)
          .seekInput(startOffsetSeconds)
          .duration(chunkLength)
          .audioChannels(1)
          .audioFrequency(16000)
          .format("wav")
          .outputOptions(["-acodec pcm_s16le"])
          .save(outputPath)
      )

      chunks.push({
        buffer: await readFile(outputPath),
        startOffsetSeconds,
      })

      baseStart += coreChunkDurationSeconds
      index += 1
    }

    return chunks
  } finally {
    await cleanupTempDirectory(tempDirectory)
  }
}

async function runFfmpegCommand(command: ReturnType<typeof ffmpeg>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    command
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error))
      .run()
  })
}

async function getMediaDurationSeconds(inputPath: string): Promise<number> {
  try {
    const { stderr } = await execFileAsync(
      ffmpegInstaller.path,
      ["-i", inputPath],
      {
        windowsHide: true,
      }
    )
    return parseDurationFromFfmpegOutput(stderr)
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error
        ? String(error.stderr)
        : ""

    const duration = parseDurationFromFfmpegOutput(stderr)
    if (duration > 0) {
      return duration
    }

    throw new Error("Could not determine media duration for chunking.")
  }
}

export async function getAudioDurationSeconds(
  audioBuffer: Buffer
): Promise<number> {
  const tempDirectory = await mkdtemp(join(tmpdir(), TEMP_PREFIX))
  const inputPath = join(tempDirectory, "probe-audio.bin")

  try {
    await writeFile(inputPath, audioBuffer)
    return await getMediaDurationSeconds(inputPath)
  } finally {
    await cleanupTempDirectory(tempDirectory)
  }
}

function parseDurationFromFfmpegOutput(output: string) {
  const match = output.match(/Duration:\s(\d{2}):(\d{2}):(\d{2}\.\d+)/)

  if (!match) {
    return 0
  }

  const [, hours, minutes, seconds] = match
  return (
    Number(hours) * 3600 + Number(minutes) * 60 + Number.parseFloat(seconds)
  )
}

function extensionFromMimeType(mimeType: string, fallback: string) {
  const normalized = mimeType.toLowerCase()

  if (normalized.includes("quicktime")) {
    return ".mov"
  }

  if (normalized.includes("webm")) {
    return ".webm"
  }

  if (normalized.includes("avi")) {
    return ".avi"
  }

  if (normalized.includes("mpeg")) {
    return ".mpeg"
  }

  const extension = extname(`file.${normalized.split("/")[1] ?? ""}`)
  return extension || fallback
}

async function cleanupTempDirectory(path: string) {
  for (const delayMs of [0, ...CLEANUP_RETRY_DELAYS_MS]) {
    if (delayMs > 0) {
      await wait(delayMs)
    }

    try {
      await rm(path, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      })
      return
    } catch (error) {
      const isLastAttempt = delayMs === CLEANUP_RETRY_DELAYS_MS.at(-1)
      if (!isLastAttempt) {
        continue
      }

      if (isBusyError(error)) {
        return
      }

      throw error
    }
  }
}

function isBusyError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EBUSY" || error.code === "EPERM")
  )
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs)
  })
}
