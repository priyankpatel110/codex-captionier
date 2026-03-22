import { NextResponse } from "next/server"

import {
  chunkAudioBuffer,
  extractAudioFromVideo,
  getAudioDurationSeconds,
} from "@/lib/audio"
import {
  SarvamApiError,
  mergeChunkedResponses,
  transcribeAudio,
  validateServerConfiguration,
} from "@/lib/sarvam"
import type {
  SarvamLanguageCode,
  TranscribeApiResponse,
  TranscriptionMode,
} from "@/types"

export const runtime = "nodejs"
export const maxDuration = 120

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024
const MAX_DIRECT_UPLOAD_BYTES = 25 * 1024 * 1024
const MAX_REST_DURATION_SECONDS = 28

export async function POST(request: Request) {
  try {
    validateServerConfiguration()
    const formData = await request.formData()
    const file = formData.get("audio")
    const languageCode = formData.get("languageCode")
    const mode = parseMode(formData.get("mode"))

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing audio file in form-data field `audio`." },
        { status: 400 }
      )
    }

    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only audio and video uploads are accepted." },
        { status: 400 }
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 500 MB limit." },
        { status: 413 }
      )
    }

    const uploadedBuffer = Buffer.from(await file.arrayBuffer())
    const requestedLanguageCode =
      typeof languageCode === "string" && languageCode.length > 0
        ? (languageCode as SarvamLanguageCode)
        : undefined

    const audioBuffer = file.type.startsWith("video/")
      ? await extractAudioFromVideo(uploadedBuffer, file.type)
      : uploadedBuffer

    const audioDurationSeconds = await getAudioDurationSeconds(audioBuffer)
    const shouldChunk =
      audioBuffer.byteLength > MAX_DIRECT_UPLOAD_BYTES ||
      audioDurationSeconds > MAX_REST_DURATION_SECONDS

    const response = shouldChunk
      ? await transcribeChunkedAudio(
          audioBuffer,
          file.name,
          requestedLanguageCode,
          mode
        )
      : await transcribeAudio(audioBuffer, toAudioFilename(file.name), {
          languageCode: requestedLanguageCode,
          model: "saaras:v3",
          mode,
          withTimestamps: true,
        })

    const payload: TranscribeApiResponse = {
      ...response,
      audio_duration_seconds: audioDurationSeconds,
      used_chunking: shouldChunk,
      output_mode: mode,
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof SarvamApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected transcription error.",
      },
      { status: 500 }
    )
  }
}

async function transcribeChunkedAudio(
  audioBuffer: Buffer,
  filename: string,
  languageCode?: SarvamLanguageCode,
  mode: TranscriptionMode = "transcribe"
) {
  const chunks = await chunkAudioBuffer(audioBuffer, MAX_REST_DURATION_SECONDS)
  const responses = await Promise.all(
    chunks.map(async (chunk, index) => ({
      startOffsetSeconds: chunk.startOffsetSeconds,
      response: await transcribeAudio(
        chunk.buffer,
        toChunkFilename(filename, index),
        {
          languageCode,
          model: "saaras:v3",
          mode,
          withTimestamps: true,
        }
      ),
    }))
  )

  return mergeChunkedResponses(responses)
}

function toAudioFilename(filename: string) {
  return `${sanitizeFilename(filename.replace(/\.[^.]+$/, "")) || "audio"}.wav`
}

function toChunkFilename(filename: string, index: number) {
  return `${sanitizeFilename(filename.replace(/\.[^.]+$/, "")) || "audio"}-chunk-${index + 1}.wav`
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "")
}

function parseMode(input: FormDataEntryValue | null): TranscriptionMode {
  const value = typeof input === "string" ? input : ""
  const allowedModes: TranscriptionMode[] = [
    "transcribe",
    "translate",
    "verbatim",
    "translit",
    "codemix",
  ]

  return allowedModes.includes(value as TranscriptionMode)
    ? (value as TranscriptionMode)
    : "transcribe"
}
