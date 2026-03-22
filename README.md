# Captionier

Phase 1 of the Captionier PRD is implemented in this workspace.

## Setup

Create `.env.local` and add:

```bash
SARVAM_API_KEY=your_sarvam_api_key_here
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload an audio file.

## API Smoke Test

With the Next.js app running locally:

```bash
node scripts/test-api.ts path/to/audio-file.wav
```

The script calls `/api/transcribe`, logs the raw normalized response, and exits non-zero if `timestamps.words` is missing or empty.
