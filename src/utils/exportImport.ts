import type { AppData, Warehouse, Photo, StorageObject } from '../types/storage'
import { generateId, getCurrentTimestamp } from './dataUtils'

/**
 * AppDataの構造が有効かどうかを検証する
 */
export function validateAppData(data: unknown): data is AppData {
  if (!data || typeof data !== 'object') return false

  const appData = data as Record<string, unknown>

  if (typeof appData.version !== 'string') return false
  if (!Array.isArray(appData.warehouses)) return false

  return true
}

/**
 * AppDataをJSON文字列としてエクスポートする
 */
export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

interface ImportResult {
  success: boolean
  data?: AppData
  error?: string
}

/**
 * JSON文字列からAppDataをインポートする
 */
export function importData(
  json: string,
  mode: 'overwrite' | 'merge',
  existingData?: AppData
): ImportResult {
  try {
    const parsed = JSON.parse(json)

    if (!validateAppData(parsed)) {
      return {
        success: false,
        error: 'データ構造が無効です',
      }
    }

    if (mode === 'overwrite') {
      return {
        success: true,
        data: parsed,
      }
    }

    // マージモード: IDを再生成して既存データに追加
    if (mode === 'merge') {
      const mergedData = mergeAppData(existingData, parsed)
      return {
        success: true,
        data: mergedData,
      }
    }

    return {
      success: false,
      error: '不明なインポートモードです',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JSONの解析に失敗しました',
    }
  }
}

/**
 * 既存データにインポートデータをマージする（IDを再生成）
 */
function mergeAppData(existing: AppData | undefined, imported: AppData): AppData {
  const now = getCurrentTimestamp()

  // インポートデータの各要素にIDを再生成
  const regeneratedWarehouses = imported.warehouses.map((warehouse) =>
    regenerateWarehouseIds(warehouse)
  )

  if (!existing) {
    return {
      ...imported,
      warehouses: regeneratedWarehouses,
      updatedAt: now,
    }
  }

  return {
    ...existing,
    warehouses: [...existing.warehouses, ...regeneratedWarehouses],
    updatedAt: now,
  }
}

/**
 * 倉庫とその子要素のIDを再生成する
 */
function regenerateWarehouseIds(warehouse: Warehouse): Warehouse {
  const now = getCurrentTimestamp()
  return {
    ...warehouse,
    id: generateId(),
    photos: warehouse.photos.map((photo) => regeneratePhotoIds(photo)),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 写真とその子要素のIDを再生成する
 */
function regeneratePhotoIds(photo: Photo): Photo {
  const now = getCurrentTimestamp()
  return {
    ...photo,
    id: generateId(),
    objects: photo.objects.map((obj) => regenerateObjectIds(obj)),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * オブジェクトのIDを再生成する
 */
function regenerateObjectIds(obj: StorageObject): StorageObject {
  const now = getCurrentTimestamp()
  return {
    ...obj,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * ファイル名に使用する日時文字列を生成する
 */
export function generateExportFileName(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `are-doko-backup-${year}${month}${day}-${hours}${minutes}${seconds}.json`
}
