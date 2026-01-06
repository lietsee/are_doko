import { v4 as uuidv4 } from 'uuid'
import type { Warehouse, Photo, StorageObject, ObjectMask, Position } from '../types/storage'

/**
 * UUID v4形式のIDを生成する
 */
export function generateId(): string {
  return uuidv4()
}

/**
 * ISO 8601形式の現在日時を返す
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * 新しい倉庫オブジェクトを作成する
 */
export function createWarehouse(name: string, memo = ''): Warehouse {
  const now = getCurrentTimestamp()
  return {
    id: generateId(),
    name,
    memo,
    photos: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 新しい写真オブジェクトを作成する
 */
export function createPhoto(
  name: string,
  imageDataUrl: string,
  width: number,
  height: number
): Photo {
  const now = getCurrentTimestamp()
  return {
    id: generateId(),
    name,
    imageDataUrl,
    width,
    height,
    objects: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 新しいオブジェクトを作成する
 */
export function createStorageObject(
  name: string,
  memo: string,
  clippedImageDataUrl: string,
  mask: ObjectMask,
  clickPoint: Position
): StorageObject {
  const now = getCurrentTimestamp()
  return {
    id: generateId(),
    name,
    memo,
    clippedImageDataUrl,
    mask,
    clickPoint,
    createdAt: now,
    updatedAt: now,
  }
}
