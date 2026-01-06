import { openDB } from 'idb'
import type { AppData } from '../types/storage'

const DB_NAME = 'areDokoAppDB'
const DB_VERSION = 1
const STORE_NAME = 'appData'
const DATA_KEY = 'currentData'

/**
 * IndexedDBを初期化する
 */
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
}

/**
 * アプリデータをIndexedDBに保存する
 */
export async function saveAppData(data: AppData): Promise<void> {
  const db = await initDB()
  await db.put(STORE_NAME, data, DATA_KEY)
}

/**
 * IndexedDBからアプリデータを読み込む
 */
export async function loadAppData(): Promise<AppData | null> {
  const db = await initDB()
  const data = await db.get(STORE_NAME, DATA_KEY)
  return data ?? null
}

/**
 * IndexedDBのアプリデータを削除する
 */
export async function clearAppData(): Promise<void> {
  const db = await initDB()
  await db.delete(STORE_NAME, DATA_KEY)
}
