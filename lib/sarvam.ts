import type {
  SarvamLanguageCode,
  SarvamTimestamps,
  SarvamTranscribeResponse,
  TranscriptionMode,
  WordTimestamp,
} from "@/types"

const SARVAM_API_URL = "https://api.sarvam.ai/speech-to-text"
const REQUIRED_ENV_VARS = ["SARVAM_API_KEY"] as const

type RawSarvamResponse = {
  request_id?: string | null
  transcript?: string
  timestamps?: unknown
  diarized_transcript?: object | null
  language_code?: string | null
  language_probability?: number | null
}

type ArrayTimestampShape = {
  words?: string[]
  start_time_seconds?: number[]
  end_time_seconds?: number[]
}

type ObjectTimestampShape = {
  words?: WordTimestamp[]
  start_time_seconds?: number
  end_time_seconds?: number
}

export class SarvamApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "SarvamApiError"
    this.status = status
  }
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  options: {
    languageCode?: SarvamLanguageCode
    model?: "saaras:v3"
    mode?: TranscriptionMode
    withTimestamps?: boolean
  } = {}
): Promise<SarvamTranscribeResponse> {
  const apiKey = getRequiredEnvVar("SARVAM_API_KEY")

  const formData = new FormData()
  const file = new File([new Uint8Array(audioBuffer)], filename)
  formData.append("file", file)
  formData.append("model", options.model ?? "saaras:v3")
  formData.append("mode", options.mode ?? "transcribe")
  formData.append(
    "with_timestamps",
    String(options.withTimestamps ?? true)
  )

  if (options.languageCode && options.languageCode !== "unknown") {
    formData.append("language_code", options.languageCode)
  }

  const response = await fetch(SARVAM_API_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    throw await createSarvamError(response)
  }

  const payload = (await response.json()) as RawSarvamResponse

  return {
    request_id: payload.request_id ?? "",
    transcript: payload.transcript ?? "",
    timestamps: normalizeTimestamps(payload.timestamps),
    diarized_transcript: payload.diarized_transcript ?? null,
    language_code: payload.language_code ?? null,
    language_probability: payload.language_probability ?? null,
  }
}

export function validateServerConfiguration() {
  for (const envVar of REQUIRED_ENV_VARS) {
    getRequiredEnvVar(envVar)
  }
}

export function mergeChunkedResponses(
  chunks: Array<{
    response: SarvamTranscribeResponse
    startOffsetSeconds: number
  }>
): SarvamTranscribeResponse {
  const sortedChunks = [...chunks].sort(
    (left, right) => left.startOffsetSeconds - right.startOffsetSeconds
  )

  const mergedWords: WordTimestamp[] = []
  let lastAcceptedEnd = -1

  for (const chunk of sortedChunks) {
    const words = chunk.response.timestamps?.words ?? []

    for (const word of words) {
      const adjustedWord = {
        word: word.word,
        start_time_seconds: word.start_time_seconds + chunk.startOffsetSeconds,
        end_time_seconds: word.end_time_seconds + chunk.startOffsetSeconds,
      }

      if (adjustedWord.end_time_seconds <= lastAcceptedEnd + 0.05) {
        continue
      }

      mergedWords.push(adjustedWord)
      lastAcceptedEnd = adjustedWord.end_time_seconds
    }
  }

  return {
    request_id: sortedChunks.map((chunk) => chunk.response.request_id).join(","),
    transcript: mergedWords.map((word) => word.word).join(" ").trim(),
    timestamps:
      mergedWords.length > 0
        ? {
            words: mergedWords,
            start_time_seconds: mergedWords[0].start_time_seconds,
            end_time_seconds: mergedWords[mergedWords.length - 1].end_time_seconds,
          }
        : null,
    diarized_transcript: null,
    language_code:
      sortedChunks.find((chunk) => chunk.response.language_code)?.response
        .language_code ?? null,
    language_probability:
      sortedChunks.find((chunk) => chunk.response.language_probability != null)
        ?.response.language_probability ?? null,
  }
}

async function createSarvamError(response: Response) {
  const bodyText = await response.text()
  const fallbackMessage = getStatusMessage(response.status)
  const trimmedBody = bodyText.trim()
  const message = trimmedBody
    ? `${fallbackMessage} Sarvam response: ${trimmedBody}`
    : fallbackMessage

  return new SarvamApiError(message, response.status)
}

function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return "Sarvam rejected the request. Verify the uploaded file and language options."
    case 401:
    case 403:
      return "Sarvam authentication failed. Check the SARVAM_API_KEY value."
    case 413:
      return "The uploaded file is too large for the current transcription flow."
    case 422:
      return "Sarvam could not process this audio file. Try another format or cleaner input."
    case 429:
      return "Sarvam rate limit reached. Wait a moment and retry."
    case 500:
    case 503:
      return "Sarvam is currently unavailable. Retry in a moment."
    default:
      return "Sarvam transcription failed."
  }
}

function getRequiredEnvVar(name: (typeof REQUIRED_ENV_VARS)[number]) {
  const value = process.env[name]

  if (!value) {
    throw new SarvamApiError(
      `${name} is missing. Add it to your server environment before transcribing.`,
      500
    )
  }

  return value
}

function normalizeTimestamps(raw: unknown): SarvamTimestamps | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const objectShape = raw as ObjectTimestampShape
  if (
    Array.isArray(objectShape.words) &&
    objectShape.words.every(
      (word) =>
        typeof word.word === "string" &&
        typeof word.start_time_seconds === "number" &&
        typeof word.end_time_seconds === "number"
    )
  ) {
    if (objectShape.words.length === 0) {
      return null
    }

    const firstWord = objectShape.words[0]
    const lastWord = objectShape.words[objectShape.words.length - 1]

    return {
      words: objectShape.words,
      start_time_seconds:
        typeof objectShape.start_time_seconds === "number"
          ? objectShape.start_time_seconds
          : firstWord.start_time_seconds,
      end_time_seconds:
        typeof objectShape.end_time_seconds === "number"
          ? objectShape.end_time_seconds
          : lastWord.end_time_seconds,
    }
  }

  const arrayShape = raw as ArrayTimestampShape
  if (
    Array.isArray(arrayShape.words) &&
    Array.isArray(arrayShape.start_time_seconds) &&
    Array.isArray(arrayShape.end_time_seconds)
  ) {
    const words = arrayShape.words
      .map((word, index) => {
        const start = arrayShape.start_time_seconds?.[index]
        const end = arrayShape.end_time_seconds?.[index]

        if (
          typeof word !== "string" ||
          typeof start !== "number" ||
          typeof end !== "number"
        ) {
          return null
        }

        return {
          word,
          start_time_seconds: start,
          end_time_seconds: end,
        }
      })
      .filter((word): word is WordTimestamp => word !== null)

    if (words.length === 0) {
      return null
    }

    return {
      words,
      start_time_seconds: words[0].start_time_seconds,
      end_time_seconds: words[words.length - 1].end_time_seconds,
    }
  }

  return null
}
