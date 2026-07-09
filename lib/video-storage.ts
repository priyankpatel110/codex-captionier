const DB_NAME = "captionier-videos"
const STORE_NAME = "videos"
const DB_VERSION = 1
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

interface VideoRecord {
  transcriptionId: string
  file: File
  storedAt: number
}

let db: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB not available")
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "transcriptionId" })
      }
    }
    request.onsuccess = (e) => {
      db = (e.target as IDBOpenDBRequest).result
      resolve(db)
    }
    request.onerror = () => reject(request.error)
  })
}

async function pruneOldVideos(database: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const cutoff = Date.now() - MAX_AGE_MS
    const tx = database.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.openCursor()
    request.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
      if (!cursor) return
      const record = cursor.value as VideoRecord
      if (record.storedAt < cutoff) cursor.delete()
      cursor.continue()
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

export async function storeVideo(transcriptionId: string, file: File): Promise<void> {
  const database = await getDB()
  await pruneOldVideos(database)
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const record: VideoRecord = { transcriptionId, file, storedAt: Date.now() }
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getVideo(transcriptionId: string): Promise<File | null> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(transcriptionId)
    request.onsuccess = () => {
      const record = request.result as VideoRecord | undefined
      resolve(record?.file ?? null)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteVideo(transcriptionId: string): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(transcriptionId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
