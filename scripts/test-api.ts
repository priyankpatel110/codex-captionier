import { readFile } from "node:fs/promises"

const filePath = process.argv[2]
const baseUrl = process.env.CAPTIONIER_BASE_URL ?? "http://localhost:3000"

if (!filePath) {
  console.error("Usage: node scripts/test-api.ts <path-to-audio-file>")
  process.exit(1)
}

const buffer = await readFile(filePath)
const formData = new FormData()
formData.append("audio", new File([buffer], filePath.split(/[\\/]/).pop() ?? "audio"))

const response = await fetch(`${baseUrl}/api/transcribe`, {
  method: "POST",
  body: formData,
})

const payload = await response.json()

console.log(JSON.stringify(payload, null, 2))

if (!response.ok) {
  console.error("Route request failed.")
  process.exit(1)
}

const words = payload?.timestamps?.words

if (!Array.isArray(words) || words.length === 0) {
  console.error("Expected timestamps.words to be populated.")
  process.exit(1)
}

console.log(`timestamps.words count: ${words.length}`)
