import type { ModelMeta } from '../types'

const DB_NAME = 'glb-library'
const DB_VERSION = 1
const META_STORE = 'models'
const BLOB_STORE = 'blobs'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

function tx<T>(storeNames: string[], mode: IDBTransactionMode, run: (tx: IDBTransaction) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeNames, mode)
        const req = run(transaction)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
        transaction.oncomplete = () => db.close()
        transaction.onerror = () => {
          reject(transaction.error ?? new Error('IndexedDB transaction failed'))
          db.close()
        }
      }),
  )
}

export async function listModels(): Promise<ModelMeta[]> {
  const all = await tx<ModelMeta[]>([META_STORE], 'readonly', (t) =>
    t.objectStore(META_STORE).getAll(),
  )
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveModel(meta: ModelMeta, blob: ArrayBuffer): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite')
    transaction.objectStore(META_STORE).put(meta)
    transaction.objectStore(BLOB_STORE).put({ id: meta.id, data: blob })
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB save failed'))
      db.close()
    }
  })
}

export async function getBlob(id: string): Promise<ArrayBuffer | null> {
  const rec = await tx<{ id: string; data: ArrayBuffer } | undefined>(
    [BLOB_STORE],
    'readonly',
    (t) => t.objectStore(BLOB_STORE).get(id),
  )
  return rec ? rec.data : null
}

export async function updateMeta(meta: ModelMeta): Promise<void> {
  await tx([META_STORE], 'readwrite', (t) => t.objectStore(META_STORE).put(meta))
}

export async function deleteModel(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite')
    transaction.objectStore(META_STORE).delete(id)
    transaction.objectStore(BLOB_STORE).delete(id)
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB delete failed'))
      db.close()
    }
  })
}
