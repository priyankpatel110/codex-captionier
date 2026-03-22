# PRD: Indian Language SRT Caption Generator
### Powered by Sarvam Saaras v3 STT | Next.js

---

## Overview

A web application that accepts video or audio file uploads and generates perfectly synced `.srt` subtitle files for all 23 Indian languages (22 Indian + English) using Sarvam's Saaras v3 speech-to-text model with word-level timestamps.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS  
**No auth, no database required**  
**API:** Sarvam AI `/speech-to-text` endpoint with `with_timestamps: true`

---

## Core Architecture (Pre-read Before Implementation)

### Sarvam Saaras v3 Key Facts
- **Endpoint:** `POST https://api.sarvam.ai/speech-to-text`
- **Model:** `saaras:v3`
- **Mode for captions:** `transcribe` (native language, default)
- **Timestamp param:** `with_timestamps: true` → returns `timestamps.words[]` with `start_time_seconds`, `end_time_seconds`
- **Supported formats:** WAV, MP3, MP4, etc. (audio input)
- **File size limit:** Check Sarvam docs — likely needs chunking for long files
- **23 languages supported** — see language table below

### SRT Format
```
1
00:00:01,000 --> 00:00:04,500
Caption text here

2
00:00:05,000 --> 00:00:09,200
Next caption line
```
- Timestamps: `HH:MM:SS,mmm`
- Each block = sequence number + timestamp range + text + blank line

### Timestamp Strategy
Saaras returns **word-level timestamps**. The app must group these words into readable caption blocks using a windowing algorithm:
- Max ~7 words per caption block OR max ~4 seconds duration
- Merge short consecutive words; never cut mid-word
- Use the `start_time_seconds` of the first word and `end_time_seconds` of the last word in each group as the SRT block range

---

## Language Reference Table

| Language | Code | Language | Code |
|----------|------|----------|------|
| Hindi | `hi-IN` | Assamese | `as-IN` |
| Bengali | `bn-IN` | Urdu | `ur-IN` |
| Kannada | `kn-IN` | Nepali | `ne-IN` |
| Malayalam | `ml-IN` | Konkani | `kok-IN` |
| Marathi | `mr-IN` | Kashmiri | `ks-IN` |
| Odia | `od-IN` | Sindhi | `sd-IN` |
| Punjabi | `pa-IN` | Sanskrit | `sa-IN` |
| Tamil | `ta-IN` | Santali | `sat-IN` |
| Telugu | `te-IN` | Manipuri | `mni-IN` |
| English | `en-IN` | Bodo | `brx-IN` |
| Gujarati | `gu-IN` | Maithili | `mai-IN` |
| | | Dogri | `doi-IN` |

---

## Phase 1 — Project Foundation & API Integration

### Goal
Establish the core Next.js project structure, environment configuration, and a working Sarvam API integration layer with proper error handling.

### Tasks

#### 1.1 Environment Setup
- Add `.env.local` with `SARVAM_API_KEY` variable
- Add `.env.example` for documentation
- Never expose the API key client-side — all Sarvam calls go through Next.js API routes

#### 1.2 Project Structure
Create the following directory structure (create all folders and placeholder files):
```
/app
  /api
    /transcribe         → POST route for STT
    /extract-audio      → POST route for video → audio extraction
  /page.tsx             → Main UI page
  /layout.tsx           → Root layout
/lib
  /sarvam.ts            → Sarvam API client
  /srt.ts               → SRT generation utilities
  /audio.ts             → Audio chunking & extraction helpers
/types
  /index.ts             → Shared TypeScript types
/components
  /FileUpload.tsx
  /LanguageSelector.tsx
  /ProgressTracker.tsx
  /SRTPreview.tsx
  /DownloadButton.tsx
```

#### 1.3 TypeScript Types (`/types/index.ts`)
Define all shared types:
```typescript
type SarvamLanguageCode = 
  'hi-IN' | 'bn-IN' | 'kn-IN' | 'ml-IN' | 'mr-IN' | 'od-IN' |
  'pa-IN' | 'ta-IN' | 'te-IN' | 'en-IN' | 'gu-IN' | 'as-IN' |
  'ur-IN' | 'ne-IN' | 'kok-IN' | 'ks-IN' | 'sd-IN' | 'sa-IN' |
  'sat-IN' | 'mni-IN' | 'brx-IN' | 'mai-IN' | 'doi-IN' | 'unknown'

interface WordTimestamp {
  word: string
  start_time_seconds: number
  end_time_seconds: number
}

interface SarvamTimestamps {
  words: WordTimestamp[]
  start_time_seconds: number
  end_time_seconds: number
}

interface SarvamTranscribeResponse {
  request_id: string
  transcript: string
  timestamps: SarvamTimestamps | null
  diarized_transcript: object | null
  language_code: string | null
  language_probability: number | null
}

interface SRTBlock {
  index: number
  startTime: string   // HH:MM:SS,mmm
  endTime: string     // HH:MM:SS,mmm
  text: string
}

interface TranscriptionJob {
  status: 'idle' | 'extracting' | 'uploading' | 'transcribing' | 'generating' | 'done' | 'error'
  progress: number    // 0–100
  message: string
  srtContent?: string
  detectedLanguage?: string
  error?: string
}
```

#### 1.4 Sarvam API Client (`/lib/sarvam.ts`)
Implement a typed wrapper around the Sarvam API:

```typescript
// Function signature
async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  options: {
    languageCode?: SarvamLanguageCode
    model?: 'saaras:v3'
    mode?: 'transcribe' | 'translate' | 'verbatim' | 'translit' | 'codemix'
    withTimestamps?: boolean
  }
): Promise<SarvamTranscribeResponse>
```

- Use `FormData` with `multipart/form-data`
- Set `with_timestamps: true` always (required for SRT sync)
- Set `model: 'saaras:v3'`
- Set `mode: 'transcribe'` as default
- Pass `language_code` only when user has explicitly selected one (omit for auto-detect)
- Auth header: `api-subscription-key: ${process.env.SARVAM_API_KEY}`
- Handle HTTP errors: 400 (bad request), 401 (bad key), 413 (file too large), 429 (rate limit), 500
- Throw typed errors with user-readable messages

#### 1.5 API Route (`/app/api/transcribe/route.ts`)
- Accept `multipart/form-data` POST with fields: `audio` (file), `languageCode` (string, optional)
- Validate file type (accept: `audio/*`, reject others with 400)
- Forward to Sarvam client
- Return `SarvamTranscribeResponse` as JSON
- Use Next.js 14 App Router format (`export async function POST(req: Request)`)
- Set `export const runtime = 'nodejs'` (required for FormData + Buffer handling)
- Set `export const maxDuration = 120` (Sarvam can be slow for longer audio)

#### 1.6 Deliverable Test
Write a simple test script `/scripts/test-api.ts` that:
- Reads a local audio file
- Calls the `/api/transcribe` route
- Logs the raw Sarvam response including timestamps
- Confirms `timestamps.words` array is populated

**Phase 1 is complete when:** The API route successfully calls Sarvam with `with_timestamps: true` and returns a valid response with word-level timestamps.

---

## Phase 2 — Audio Extraction & Chunking

### Goal
Handle video files (extract audio) and long audio files (chunk into segments) since Sarvam has file size limits and processes audio, not video.

### Background
- Sarvam accepts audio files, not video
- Long recordings (>10 min) likely need to be chunked into overlapping segments
- Browser-side: use Web Audio API or FFmpeg WASM for extraction
- Server-side: use `fluent-ffmpeg` in the API route

### Tasks

#### 2.1 Install Dependencies
```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
npm install --save-dev @types/fluent-ffmpeg
```

#### 2.2 Audio Extraction Utility (`/lib/audio.ts`)

**Function 1: `extractAudioFromVideo`**
```typescript
async function extractAudioFromVideo(
  videoBuffer: Buffer,
  inputMimeType: string
): Promise<Buffer>  // Returns MP3/WAV buffer
```
- Use `fluent-ffmpeg` with temp files in `/tmp`
- Extract audio at 16kHz mono WAV (optimal for STT)
- Clean up temp files after

**Function 2: `chunkAudioBuffer`**
```typescript
async function chunkAudioBuffer(
  audioBuffer: Buffer,
  chunkDurationSeconds?: number  // default: 300 (5 minutes)
): Promise<Array<{ buffer: Buffer, startOffsetSeconds: number }>>
```
- Split audio into chunks of `chunkDurationSeconds` with 2-second overlap at boundaries
- Return each chunk with its `startOffsetSeconds` so timestamps can be offset correctly
- Use ffmpeg's `-ss` and `-t` flags for splitting

#### 2.3 Extract Audio API Route (`/app/api/extract-audio/route.ts`)
- Accept video file upload
- Return audio buffer as binary response (`audio/wav`)
- Used by the frontend before sending to `/api/transcribe`

#### 2.4 Update Transcribe Route
Modify `/app/api/transcribe/route.ts`:
- Detect if input is video (by MIME type: `video/*`)
- If video: extract audio first, then transcribe
- If audio > 25MB: chunk the audio, transcribe each chunk, merge results with timestamp offsets
- Offset merging: for each chunk's `words[]`, add `startOffsetSeconds` to all `start_time_seconds` and `end_time_seconds`

#### 2.5 Chunk Merging Logic
```typescript
function mergeChunkedResponses(
  chunks: Array<{
    response: SarvamTranscribeResponse,
    startOffsetSeconds: number
  }>
): SarvamTranscribeResponse
```
- Combine all `words[]` arrays with offset timestamps applied
- Concatenate `transcript` strings
- Return merged response that looks like a single Sarvam response

**Phase 2 is complete when:** A 30-minute MP4 video can be processed end-to-end and return a full merged timestamp array.

---

## Phase 3 — SRT Generation Engine

### Goal
Convert Sarvam's word-level timestamps into perfectly synced, readable SRT blocks.

### Tasks

#### 3.1 SRT Utilities (`/lib/srt.ts`)

**Function 1: `secondsToSRTTimestamp`**
```typescript
function secondsToSRTTimestamp(seconds: number): string
// 4.512 → "00:00:04,512"
// 61.03 → "00:01:01,030"
```

**Function 2: `groupWordsIntoBlocks`**
```typescript
function groupWordsIntoBlocks(
  words: WordTimestamp[],
  options?: {
    maxWordsPerBlock?: number      // default: 7
    maxDurationSeconds?: number    // default: 4.0
    minDurationSeconds?: number    // default: 0.5
  }
): Array<WordTimestamp[]>
```
**Grouping algorithm:**
1. Start a new block with the first word
2. For each subsequent word:
   - If adding it would exceed `maxWordsPerBlock` → close block, start new
   - If `(current_word.end_time - block_start.start_time) > maxDurationSeconds` → close block, start new
   - If there's a silence gap > 0.8 seconds between words → close block, start new
   - Otherwise → add to current block
3. Return array of word groups

**Function 3: `buildSRTContent`**
```typescript
function buildSRTContent(words: WordTimestamp[]): string
```
- Calls `groupWordsIntoBlocks`
- For each group: format as SRT block with `secondsToSRTTimestamp`
- Join text in group with spaces
- Return full `.srt` file string

**Function 4: `validateSRT`**
```typescript
function validateSRT(srtContent: string): { valid: boolean; blockCount: number; errors: string[] }
```
- Parse the SRT and verify format
- Check timestamps are monotonically increasing
- Check no overlapping timestamps
- Return validation result

#### 3.2 Edge Cases to Handle
- Words with identical start/end times → set minimum 100ms duration
- Empty transcript → return empty SRT with comment
- Single word → still wrap in valid SRT block
- Very fast speech → allow up to 10 words per block if duration < 3s
- RTL languages (Urdu) → no special handling needed in SRT text itself; SRT is plain text

#### 3.3 SRT Preview Renderer
In `/components/SRTPreview.tsx`:
- Parse and display SRT blocks in a readable list UI
- Show timestamp + text for each block
- Show total block count and total duration
- Color-code: blocks under 1 second (yellow warning), blocks over 7 seconds (red warning)

**Phase 3 is complete when:** Given a mock `WordTimestamp[]` array, `buildSRTContent` produces valid, well-grouped SRT output that passes `validateSRT`.

---

## Phase 4 — Frontend UI

### Goal
Build a clean, functional, single-page UI that guides the user through upload → config → generation → download.

### Design Principles
- Mobile-friendly
- Clear progress states
- No page navigation — everything on one page
- Support drag-and-drop upload

### Tasks

#### 4.1 Main Page Layout (`/app/page.tsx`)
Single column layout with these sections (in order):
1. **Header** — App name, tagline ("Generate SRT captions for Indian language videos")
2. **Upload Zone** — Drag & drop or click to upload
3. **Configuration Panel** — Language selector + mode options (shown after file selected)
4. **Progress Tracker** — Shown during processing
5. **Result Panel** — SRT preview + download button (shown after success)

**State machine in page:**
```
idle → file_selected → processing → done
                                  ↘ error
```

#### 4.2 File Upload Component (`/components/FileUpload.tsx`)
- Drag-and-drop zone with dashed border
- Accept: `audio/*`, `video/*`
- Show file name, size, and type icon after selection
- Show warning if file > 500MB (processing will be slow)
- Display detected file type (Video / Audio)
- Clear/reset button

#### 4.3 Language Selector Component (`/components/LanguageSelector.tsx`)
- Dropdown or searchable select
- First option: "Auto-detect" (sends no `language_code` to Sarvam)
- Then list all 23 languages with their display names and codes
- Group by script family for UX (Devanagari group, Dravidian group, etc.) — optional enhancement
- Show detected language after transcription completes (from `language_code` in response)

#### 4.4 Progress Tracker Component (`/components/ProgressTracker.tsx`)
Show a progress bar and status message through these stages:
```
[Extracting audio from video...]     → 10%
[Uploading audio to Sarvam...]       → 30%
[Transcribing with Saaras v3...]     → 60%
[Generating SRT timestamps...]       → 85%
[Validating caption sync...]         → 95%
[Done!]                              → 100%
```
- Animate the progress bar
- Show elapsed time
- Show "This may take a moment for longer files" if > 30s elapsed

#### 4.5 Result Panel
After success, show:
- ✅ "Captions generated successfully"
- Detected language (if auto-detect was used)
- Number of caption blocks
- Estimated duration covered
- SRTPreview component (scrollable list of blocks, max height 400px)
- Large Download button: "Download .srt file"
- Secondary button: "Start over" (resets to idle)

#### 4.6 Download Logic
- Filename format: `{original_filename_without_ext}_captions_{languageCode}.srt`
  - Example: `wedding_video_captions_hi-IN.srt`
- Use `URL.createObjectURL(new Blob([srtContent], { type: 'text/plain' }))`
- Trigger download via `<a>` tag click
- Do not save to server — purely client-side download

#### 4.7 Error Handling UI
For each error type, show a friendly message:
- File too large → "File exceeds limit. Try compressing the audio first."
- Unsupported format → "Please upload an MP4, MOV, MP3, WAV, or M4A file."
- API key error → "Server configuration error. Please contact support."
- Rate limit → "Too many requests. Please wait a moment and try again."
- No speech detected → "No speech was detected in the audio. Please check the file."
- Generic → "Something went wrong. Please try again."

**Phase 4 is complete when:** A user can upload a video, pick a language, watch progress, and download the SRT file.

---

## Phase 5 — Polish, Performance & Edge Cases

### Goal
Handle real-world edge cases, improve UX for long files, and add quality-of-life features.

### Tasks

#### 5.1 Large File Handling
- Show estimated processing time before upload: `~1 min per 10 minutes of audio`
- Stream progress updates from the API route to the frontend using Server-Sent Events (SSE)
  - The transcribe API route should emit progress events at each pipeline stage
  - Frontend subscribes to `/api/transcribe/progress` SSE stream

**SSE Implementation:**
```typescript
// In API route
const stream = new ReadableStream({
  start(controller) {
    const send = (data: object) => {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    }
    send({ stage: 'extracting', progress: 10 })
    // ... processing ...
    send({ stage: 'done', progress: 100, srtContent })
    controller.close()
  }
})
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
})
```

#### 5.2 Caption Quality Settings (UI additions)
Add an "Advanced Settings" collapsible panel:
- **Words per caption block:** Slider 4–12 (default 7)
- **Max block duration:** Slider 2–6 seconds (default 4)
- **Output mode:** Radio buttons
  - Transcribe (original language) — default
  - Translate to English
  - Transliterate (Roman script)
  - Code-mixed

These settings are passed to the API and to the SRT generator.

#### 5.3 Multi-language Output (Bonus)
If user selects "Auto-detect", after transcription offer a secondary option: "Also generate English translation" — triggers a second API call with `mode: 'translate'` and generates a second `.srt` file.

#### 5.4 SRT Validation & Warning UI
After generation, display warnings:
- ⚠️ N blocks are very short (< 0.5s) — may flash too quickly
- ⚠️ N blocks are very long (> 6s) — may be hard to read
- ⚠️ Total SRT duration vs audio duration discrepancy > 5% — possible sync issue

#### 5.5 Copy to Clipboard
Add a "Copy SRT" button next to Download that copies the raw SRT content to clipboard.

#### 5.6 Responsive Design QA
- Test on mobile viewport (375px width)
- Ensure file upload zone is tappable on touch devices
- Ensure dropdowns are mobile-friendly

#### 5.7 Environment & Security Hardening
- Validate `SARVAM_API_KEY` is set on server startup — throw clear error if missing
- Add `next.config.js` to block client-side access to API key
- Sanitize filenames in download (remove special characters)
- Add max file size check server-side (reject > 500MB with 413 before hitting Sarvam)

**Phase 5 is complete when:** The app handles a 1-hour video without crashes, SSE progress works, and caption quality warnings are shown.

---

---

## Screen Specifications

This app is a **single-page application** — there is no routing. All screens are states of the same page (`/app/page.tsx`). The page transitions between states based on user actions and processing progress.

---

### Screen 1 — Landing / Upload (Idle State)

**Trigger:** Initial page load, or after user clicks "Start Over"

**Layout (top to bottom):**
```
┌─────────────────────────────────────────┐
│  🎙️  SRT Caption Generator              │
│  Generate perfectly synced captions for │
│  Indian language videos — powered by    │
│  Sarvam Saaras v3                       │
├─────────────────────────────────────────┤
│                                         │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│   |                                 |   │
│   |   📁  Drag & drop your file     |   │
│   |   or click to browse            |   │
│   |                                 |   │
│   |   Supports: MP4, MOV, MKV,      |   │
│   |   MP3, WAV, M4A, OGG            |   │
│   |                                 |   │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- App logo/icon (microphone or waveform icon)
- App name: "SRT Caption Generator"
- Subtitle tagline
- Upload zone: large dashed-border box, centered, takes up majority of vertical space
- Upload zone shows cloud-upload icon + primary text + supported formats
- Hidden `<input type="file" accept="audio/*,video/*">`
- Entire dashed zone is clickable

**Interactions:**
- Click anywhere in dashed zone → opens OS file picker
- Drag file over zone → zone border turns solid/highlighted (drag-over state)
- Drop file → transitions to Screen 2
- Pick file via picker → transitions to Screen 2

**Drag-over visual state:**
- Border: dashed → solid, accent color
- Background: light tinted
- Text changes to "Drop to upload"

---

### Screen 2 — File Selected / Configuration

**Trigger:** User has selected or dropped a valid file

**Layout:**
```
┌─────────────────────────────────────────┐
│  🎙️  SRT Caption Generator              │
├─────────────────────────────────────────┤
│                                         │
│  ✅  File Ready                          │
│  ┌───────────────────────────────────┐  │
│  │ 🎬  wedding_video.mp4             │  │
│  │     Video • 245 MB • ~18 min      │  │
│  │                              [✕]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── Configure Captions ──────────────── │
│                                         │
│  Language                               │
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Auto-detect language      ▾  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Output Mode                            │
│  ● Transcribe (original language)       │
│  ○ Translate to English                 │
│  ○ Transliterate (Roman script)         │
│  ○ Code-mixed                           │
│                                         │
│  ▸ Advanced Settings                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │   Generate Captions  →          │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**

*File info card:*
- File type icon (🎬 for video, 🎵 for audio)
- Filename
- Type label (Video / Audio) • File size • Estimated duration (if detectable)
- ✕ remove/clear button (top-right of card) → returns to Screen 1

*Language selector:*
- Dropdown, default "Auto-detect language"
- Grouped options:
  - Auto-detect (top, separated by divider)
  - North Indian: Hindi, Bengali, Punjabi, Urdu, Maithili, Dogri, Kashmiri, Sindhi, Nepali, Sanskrit
  - Dravidian: Tamil, Telugu, Kannada, Malayalam
  - East/Northeast: Odia, Assamese, Manipuri, Bodo, Santali
  - West: Gujarati, Marathi, Konkani
  - Other: English

*Output mode:*
- 4 radio buttons as described
- Short description under each (1 line): e.g. "Transcribe" → "Captions in the spoken language"

*Advanced Settings (collapsed by default):*
- Chevron icon + "Advanced Settings" label, clickable to expand
- When expanded, shows:
  - Words per block: range slider 4–12, default 7, shows current value
  - Max block duration: range slider 2–6 seconds, default 4s, shows current value
  - Small explainer: "Lower values = more frequent caption changes"

*Generate button:*
- Full-width primary button
- Label: "Generate Captions →"
- Disabled if no file selected (shouldn't happen on this screen, but guard anyway)

**Validation:**
- If file > 500MB: show inline orange warning below file card: "⚠️ Large file detected. Processing may take several minutes."
- If file format is unsupported (caught on drop): show red error and stay on Screen 1 with error toast

---

### Screen 3 — Processing / Progress

**Trigger:** User clicks "Generate Captions"

**Layout:**
```
┌─────────────────────────────────────────┐
│  🎙️  SRT Caption Generator              │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🎬  wedding_video.mp4             │  │
│  │     Video • 245 MB                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Processing...                          │
│                                         │
│  ████████████░░░░░░░░░░░░  45%          │
│                                         │
│  ⏳  Transcribing with Saaras v3...     │
│     This may take a moment for          │
│     longer files                        │
│                                         │
│  ✅  Audio extracted                    │
│  ✅  Uploaded to Sarvam                 │
│  ⏳  Transcribing... (current)          │
│  ○   Generating SRT blocks              │
│  ○   Validating sync                    │
│                                         │
│  Elapsed: 0:42                          │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**

*File card:* Same compact file info card (non-interactive, no ✕ button)

*Progress bar:*
- Animated fill, percentage shown
- Smooth transition between stages

*Current stage message:* Large status text below progress bar

*Stage checklist:*
- All pipeline stages listed vertically
- ✅ = complete, ⏳ = in progress (animated), ○ = pending
- Stages: "Extracting audio" (video only), "Uploading to Sarvam", "Transcribing with Saaras v3", "Generating SRT blocks", "Validating sync"
- "Extracting audio" stage is hidden if input is already an audio file

*Elapsed timer:* Updates every second from when Generate was clicked

*Long-running notice:* Appears after 30 seconds — "Still working... large files can take a few minutes"

**No cancel button** in v1. Page should not be navigated away from (add a `beforeunload` warning).

**Stage → progress % mapping:**
| Stage | Progress |
|-------|----------|
| Extracting audio | 5% → 15% |
| Uploading | 15% → 30% |
| Transcribing | 30% → 75% |
| Generating SRT | 75% → 90% |
| Validating | 90% → 100% |

---

### Screen 4 — Success / Results

**Trigger:** Processing completes successfully

**Layout:**
```
┌─────────────────────────────────────────┐
│  🎙️  SRT Caption Generator              │
├─────────────────────────────────────────┤
│                                         │
│  ✅  Captions Generated!                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Language detected: Hindi (hi-IN) │  │
│  │  Caption blocks: 284              │  │
│  │  Duration covered: 18m 23s        │  │
│  │  Output mode: Transcribe          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⚠️  3 blocks are very short (<0.5s)    │
│                                         │
│  Preview                     [Copy SRT] │
│  ┌───────────────────────────────────┐  │
│  │ 1  00:00:01,200 → 00:00:03,800   │  │
│  │    नमस्ते दोस्तों आज हम बात करेंगे  │  │
│  │                                   │  │
│  │ 2  00:00:04,100 → 00:00:07,200   │  │
│  │    आज के इस खास मौके पर           │  │
│  │    ···                            │  │
│  │  (scrollable, max height 360px)   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ⬇  Download .srt file          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Generate English translation too →]   │
│                                         │
│  [← Start Over]                         │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**

*Success banner:* Green ✅ icon + "Captions Generated!" heading

*Stats card:*
- Detected language (with flag emoji if available, language name + code)
- Total caption blocks count
- Duration covered (derived from last SRT block end time)
- Output mode used
- If user selected a specific language (not auto-detect), omit "detected" and show "Language: Hindi (hi-IN)"

*Quality warnings (if any):*
- Orange ⚠️ inline alerts for:
  - N blocks under 0.5s
  - N blocks over 6s
  - Sync discrepancy > 5%
- If no warnings: show green "✅ All caption blocks look good"

*SRT Preview panel:*
- Scrollable list, max 360px height
- Each row: index number, timestamp range, caption text
- Alternating row background for readability
- "Copy SRT" button (top-right of panel) copies raw SRT to clipboard, shows "Copied!" toast

*Download button:*
- Full-width, prominent primary button
- Label: "⬇ Download .srt file"
- Filename on hover/below: `wedding_video_captions_hi-IN.srt`

*Generate translation link (secondary action):*
- Text link or ghost button: "Generate English translation too →"
- Clicking this triggers a second API call with `mode: 'translate'`
- While the second call runs, button shows spinner and "Generating..."
- On complete, a second download button appears: "⬇ Download English translation .srt"

*Start Over button:*
- Text link at bottom: "← Start Over"
- Resets all state, returns to Screen 1

---

### Screen 5 — Error State

**Trigger:** Any unrecoverable error during processing

**Layout:**
```
┌─────────────────────────────────────────┐
│  🎙️  SRT Caption Generator              │
├─────────────────────────────────────────┤
│                                         │
│  ❌  Something went wrong               │
│                                         │
│  No speech detected in the audio.       │
│  Please check that the file contains    │
│  audible speech and try again.          │
│                                         │
│  Error details (for debugging):         │
│  ┌───────────────────────────────────┐  │
│  │  Stage: Transcribing              │  │
│  │  Code: NO_SPEECH_DETECTED         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ← Try Again                    │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Red ❌ icon + "Something went wrong" heading
- User-friendly error message (mapped from error code — see Phase 4.7)
- Collapsible "Error details" card showing raw stage + code (for debugging/reporting)
- "Try Again" button → returns to Screen 2 (retains file + settings, does NOT clear)

**Error message mapping:**
| Condition | User Message |
|-----------|-------------|
| File too large (413) | "File is too large. Try compressing or trimming the video first." |
| Unsupported format | "This file format isn't supported. Please upload MP4, MOV, MP3, or WAV." |
| No speech detected | "No speech was detected. Check that the file has audible speech." |
| API key missing/invalid (401) | "Server configuration error. Please contact support." |
| Rate limited (429) | "Too many requests. Please wait a moment, then try again." |
| Network error | "Connection failed. Please check your internet and try again." |
| Audio extraction failed | "Couldn't extract audio from this video file. Try a different format." |
| Timeout | "Request timed out. The file may be too long — try a shorter clip." |
| Generic/unknown | "Something went wrong. Please try again." |

---

### Screen State Transition Diagram

```
                    ┌──────────────┐
                    │   Screen 1   │◄──────────────────────┐
                    │  Upload/Idle │                       │
                    └──────┬───────┘                       │
                           │ File selected                 │
                           ▼                               │
                    ┌──────────────┐                       │
                    │   Screen 2   │──── Clear file ───────┘
                    │  Configure   │
                    └──────┬───────┘
                           │ Click "Generate"
                           ▼
                    ┌──────────────┐
                    │   Screen 3   │
                    │  Processing  │
                    └──────┬───────┘
                      ┌────┴─────┐
                      │          │
                      ▼          ▼
               ┌──────────┐  ┌──────────┐
               │ Screen 4 │  │ Screen 5 │
               │ Success  │  │  Error   │
               └────┬─────┘  └────┬─────┘
                    │              │
               Start Over     Try Again
                    │              │
                    ▼              ▼
               Screen 1       Screen 2
```

---

## Appendix A — File Type Support Matrix

| Extension | MIME Type | Needs Video Extraction | Notes |
|-----------|-----------|----------------------|-------|
| .mp4 | video/mp4 | ✅ Yes | Most common |
| .mov | video/quicktime | ✅ Yes | iOS recordings |
| .mkv | video/x-matroska | ✅ Yes | |
| .avi | video/x-msvideo | ✅ Yes | |
| .mp3 | audio/mpeg | ❌ No | Direct upload |
| .wav | audio/wav | ❌ No | Direct upload |
| .m4a | audio/mp4 | ❌ No | Direct upload |
| .ogg | audio/ogg | ❌ No | Direct upload |
| .flac | audio/flac | ❌ No | Direct upload |

---

## Appendix B — Sarvam API Request Shape

```bash
curl -X POST https://api.sarvam.ai/speech-to-text \
  -H "api-subscription-key: YOUR_API_KEY" \
  -F "file=@audio.wav" \
  -F "model=saaras:v3" \
  -F "mode=transcribe" \
  -F "with_timestamps=true" \
  -F "language_code=hi-IN"   # omit for auto-detect
```

**Response shape (with timestamps):**
```json
{
  "request_id": "abc123",
  "transcript": "नमस्ते दुनिया",
  "timestamps": {
    "start_time_seconds": 0.0,
    "end_time_seconds": 2.1,
    "words": [
      { "word": "नमस्ते", "start_time_seconds": 0.0, "end_time_seconds": 0.9 },
      { "word": "दुनिया", "start_time_seconds": 1.0, "end_time_seconds": 2.1 }
    ]
  },
  "language_code": "hi-IN",
  "language_probability": 0.97
}
```

---

## Appendix C — SRT Generation Pseudocode

```
words = sarvamResponse.timestamps.words
blocks = []
currentBlock = []

for word in words:
  if currentBlock is empty:
    currentBlock.push(word)
    continue

  blockDuration = word.end_time - currentBlock[0].start_time
  silenceGap = word.start_time - currentBlock[-1].end_time

  if len(currentBlock) >= maxWords
     OR blockDuration > maxDuration
     OR silenceGap > 0.8:
    blocks.push(currentBlock)
    currentBlock = [word]
  else:
    currentBlock.push(word)

if currentBlock is not empty:
  blocks.push(currentBlock)

srtLines = []
for i, block in enumerate(blocks):
  start = secondsToSRTTimestamp(block[0].start_time)
  end = secondsToSRTTimestamp(block[-1].end_time)
  text = block.map(w => w.word).join(" ")
  srtLines.push(`${i+1}\n${start} --> ${end}\n${text}\n`)

return srtLines.join("\n")
```

---

## Appendix D — Implementation Order for AI Agent

Execute phases strictly in this order. Do not start the next phase until the current one is verified working:

1. **Phase 1** — API integration + project structure
2. **Phase 2** — Video extraction + audio chunking
3. **Phase 3** — SRT generation engine (test with mock data first)
4. **Phase 4** — Frontend UI (connect all pieces)
5. **Phase 5** — Polish, SSE streaming, edge cases

Each phase ends with a clear deliverable test described in the phase. Run those tests before proceeding.

---

*PRD Version 1.0 | Generated for Next.js implementation with Sarvam Saaras v3*
