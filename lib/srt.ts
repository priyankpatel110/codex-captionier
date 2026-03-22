import type {
  ParsedSRTBlock,
  SRTBlock,
  SRTValidationResult,
  WordTimestamp,
} from "@/types"

const DEFAULT_MAX_WORDS = 7
const FAST_SPEECH_MAX_WORDS = 10
const DEFAULT_MAX_DURATION_SECONDS = 4
const DEFAULT_MIN_DURATION_SECONDS = 0.5
const MAX_SILENCE_GAP_SECONDS = 0.8
const MIN_WORD_DURATION_SECONDS = 0.1
const EMPTY_SRT_COMMENT = "NOTE Empty transcript"

export function secondsToSRTTimestamp(seconds: number): string {
  const safeSeconds = Math.max(seconds, 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const wholeSeconds = Math.floor(safeSeconds % 60)
  const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000)
  const normalizedMilliseconds = milliseconds === 1000 ? 999 : milliseconds

  return [hours, minutes, wholeSeconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":")
    .concat(",", normalizedMilliseconds.toString().padStart(3, "0"))
}

export const formatSrtTimestamp = secondsToSRTTimestamp

export function groupWordsIntoBlocks(
  words: WordTimestamp[],
  options?: {
    maxWordsPerBlock?: number
    maxDurationSeconds?: number
    minDurationSeconds?: number
  }
): Array<WordTimestamp[]> {
  if (words.length === 0) {
    return []
  }

  const maxWordsPerBlock = options?.maxWordsPerBlock ?? DEFAULT_MAX_WORDS
  const maxDurationSeconds =
    options?.maxDurationSeconds ?? DEFAULT_MAX_DURATION_SECONDS
  const minDurationSeconds =
    options?.minDurationSeconds ?? DEFAULT_MIN_DURATION_SECONDS
  const normalizedWords = normalizeWordTimestamps(
    expandTimedSegments(words, maxWordsPerBlock, maxDurationSeconds),
    minDurationSeconds
  )

  const blocks: Array<WordTimestamp[]> = []
  let currentBlock: WordTimestamp[] = []

  for (const word of normalizedWords) {
    if (currentBlock.length === 0) {
      currentBlock.push(word)
      continue
    }

    const previousWord = currentBlock[currentBlock.length - 1]
    const blockStart = currentBlock[0].start_time_seconds
    const proposedEnd = word.end_time_seconds
    const blockDuration = proposedEnd - blockStart
    const silenceGap = word.start_time_seconds - previousWord.end_time_seconds
    const currentWordLimit =
      blockDuration < 3 ? FAST_SPEECH_MAX_WORDS : maxWordsPerBlock
    const shouldFlush =
      currentBlock.length >= currentWordLimit ||
      blockDuration > maxDurationSeconds ||
      silenceGap > MAX_SILENCE_GAP_SECONDS

    if (shouldFlush) {
      blocks.push(currentBlock)
      currentBlock = [word]
      continue
    }

    currentBlock.push(word)
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock)
  }

  return blocks
}

export function groupWordsIntoSrtBlocks(
  words: WordTimestamp[],
  options?: {
    maxWordsPerBlock?: number
    maxDurationSeconds?: number
    minDurationSeconds?: number
  }
): SRTBlock[] {
  return groupWordsIntoBlocks(words, options).map((group, index) =>
    createBlock(index + 1, group)
  )
}

export function buildSRTContent(
  words: WordTimestamp[],
  options?: {
    maxWordsPerBlock?: number
    maxDurationSeconds?: number
    minDurationSeconds?: number
  }
): string {
  if (words.length === 0) {
    return EMPTY_SRT_COMMENT
  }

  return groupWordsIntoSrtBlocks(words, options)
    .map(
      (block) =>
        `${block.index}\n${block.startTime} --> ${block.endTime}\n${block.text}`
    )
    .join("\n\n")
}

export const generateSrt = buildSRTContent

export function validateSRT(srtContent: string): SRTValidationResult {
  if (!srtContent.trim()) {
    return {
      valid: false,
      blockCount: 0,
      errors: ["SRT content is empty."],
    }
  }

  if (srtContent.trim() === EMPTY_SRT_COMMENT) {
    return {
      valid: true,
      blockCount: 0,
      errors: [],
    }
  }

  const parsed = parseSRTContent(srtContent)
  const errors: string[] = []

  if (parsed.length === 0) {
    errors.push("No valid SRT blocks were found.")
  }

  let previousEnd = -1

  for (const block of parsed) {
    if (block.endSeconds <= block.startSeconds) {
      errors.push(`Block ${block.index} has an invalid time range.`)
    }

    if (block.startSeconds < previousEnd) {
      errors.push(`Block ${block.index} overlaps the previous block.`)
    }

    previousEnd = Math.max(previousEnd, block.endSeconds)
  }

  return {
    valid: errors.length === 0,
    blockCount: parsed.length,
    errors,
  }
}

export function parseSRTContent(srtContent: string): ParsedSRTBlock[] {
  if (!srtContent.trim() || srtContent.trim() === EMPTY_SRT_COMMENT) {
    return []
  }

  return srtContent
    .trim()
    .split(/\r?\n\r?\n/)
    .map((chunk) => parseSRTBlock(chunk))
    .filter((block): block is ParsedSRTBlock => block !== null)
}

function parseSRTBlock(chunk: string): ParsedSRTBlock | null {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 3) {
    return null
  }

  const index = Number.parseInt(lines[0], 10)
  const [startTime = "", endTime = ""] = lines[1].split(/\s+-->\s+/)
  const startSeconds = parseSRTTimestamp(startTime)
  const endSeconds = parseSRTTimestamp(endTime)

  if (
    !Number.isFinite(index) ||
    !Number.isFinite(startSeconds) ||
    !Number.isFinite(endSeconds)
  ) {
    return null
  }

  return {
    index,
    startTime,
    endTime,
    text: lines.slice(2).join(" "),
    startSeconds,
    endSeconds,
    durationSeconds: Math.max(0, endSeconds - startSeconds),
  }
}

function parseSRTTimestamp(timestamp: string) {
  const match = timestamp.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/)

  if (!match) {
    return Number.NaN
  }

  const [, hours, minutes, seconds, milliseconds] = match
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(milliseconds) / 1000
  )
}

function normalizeWordTimestamps(
  words: WordTimestamp[],
  minDurationSeconds: number
) {
  return words
    .map((word, index, list) => {
      const start = Math.max(word.start_time_seconds, 0)
      const nextStart = list[index + 1]?.start_time_seconds
      const minEnd = start + Math.max(minDurationSeconds, MIN_WORD_DURATION_SECONDS)
      const boundedEnd =
        typeof nextStart === "number" ? Math.min(minEnd, nextStart) : minEnd
      const end = Math.max(word.end_time_seconds, boundedEnd)

      return {
        word: word.word.trim(),
        start_time_seconds: start,
        end_time_seconds: end,
      }
    })
    .filter((word) => word.word.length > 0)
}

function expandTimedSegments(
  words: WordTimestamp[],
  maxWordsPerBlock: number,
  maxDurationSeconds: number
) {
  return words.flatMap((word) => {
    const tokens = tokenize(word.word)
    const duration = Math.max(
      word.end_time_seconds - word.start_time_seconds,
      MIN_WORD_DURATION_SECONDS
    )
    const shouldExpand =
      tokens.length > 1 &&
      (tokens.length > maxWordsPerBlock || duration > maxDurationSeconds)

    if (!shouldExpand) {
      return [{ ...word, word: word.word.trim() }].filter(
        (item) => item.word.length > 0
      )
    }

    const tokenDuration = duration / tokens.length

    return tokens.map((token, index) => {
      const start = word.start_time_seconds + tokenDuration * index
      const end =
        index === tokens.length - 1
          ? word.end_time_seconds
          : word.start_time_seconds + tokenDuration * (index + 1)

      return {
        word: token,
        start_time_seconds: start,
        end_time_seconds: end,
      }
    })
  })
}

function tokenize(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function createBlock(index: number, words: WordTimestamp[]): SRTBlock {
  return {
    index,
    startTime: secondsToSRTTimestamp(words[0].start_time_seconds),
    endTime: secondsToSRTTimestamp(
      words[words.length - 1].end_time_seconds
    ),
    text: words.map((word) => word.word).join(" ").trim(),
  }
}
