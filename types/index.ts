export type SarvamLanguageCode =
  | "hi-IN"
  | "bn-IN"
  | "kn-IN"
  | "ml-IN"
  | "mr-IN"
  | "od-IN"
  | "pa-IN"
  | "ta-IN"
  | "te-IN"
  | "en-IN"
  | "gu-IN"
  | "as-IN"
  | "ur-IN"
  | "ne-IN"
  | "kok-IN"
  | "ks-IN"
  | "sd-IN"
  | "sa-IN"
  | "sat-IN"
  | "mni-IN"
  | "brx-IN"
  | "mai-IN"
  | "doi-IN"
  | "unknown"

export type TranscriptionMode =
  | "transcribe"
  | "translate"
  | "verbatim"
  | "translit"
  | "codemix"

export interface WordTimestamp {
  word: string
  start_time_seconds: number
  end_time_seconds: number
}

export interface SarvamTimestamps {
  words: WordTimestamp[]
  start_time_seconds: number
  end_time_seconds: number
}

export interface SarvamTranscribeResponse {
  request_id: string
  transcript: string
  timestamps: SarvamTimestamps | null
  diarized_transcript: object | null
  language_code: string | null
  language_probability: number | null
}

export interface SRTBlock {
  index: number
  startTime: string
  endTime: string
  text: string
}

export interface ParsedSRTBlock extends SRTBlock {
  startSeconds: number
  endSeconds: number
  durationSeconds: number
}

export interface SRTValidationResult {
  valid: boolean
  blockCount: number
  errors: string[]
}

export interface CaptionSettings {
  maxWordsPerBlock: number
  maxDurationSeconds: number
  mode: TranscriptionMode
}

export interface UsageSummary {
  availableSeconds: number
  creditsRemainingSeconds: number
  pendingSeconds: number
  totalGrantedSeconds: number
}

export interface TranscribeApiResponse extends SarvamTranscribeResponse {
  audio_duration_seconds: number
  credits: UsageSummary
  used_chunking: boolean
  output_mode: TranscriptionMode
}

export interface TranscriptionJob {
  status:
    | "idle"
    | "extracting"
    | "uploading"
    | "transcribing"
    | "generating"
    | "done"
    | "error"
  progress: number
  message: string
  srtContent?: string
  detectedLanguage?: string
  error?: string
}

export interface LanguageOption {
  label: string
  value: SarvamLanguageCode
}
