import type { Position, ObjectMask, RectMask, StorageObject } from '../types/storage'

/**
 * 点がポリゴン内にあるかどうかを判定する (Ray Casting Algorithm)
 */
export function isPointInPolygon(point: Position, polygon: Position[]): boolean {
  const { x, y } = point
  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

/**
 * 点が矩形内にあるかどうかを判定する
 */
export function isPointInRect(point: Position, rect: RectMask): boolean {
  const { x, y } = point
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

/**
 * 点がマスク内にあるかどうかを判定する
 */
export function isPointInMask(point: Position, mask: ObjectMask): boolean {
  if (mask.type === 'polygon') {
    return isPointInPolygon(point, mask.points)
  } else {
    return isPointInRect(point, mask)
  }
}

/**
 * 指定した点にあるオブジェクトを探す
 * 複数重なる場合は配列の後ろ（後に登録されたもの）を優先
 */
export function findObjectAtPoint(
  point: Position,
  objects: StorageObject[]
): StorageObject | null {
  // 配列を逆順で探索（後ろが優先）
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    if (isPointInMask(point, obj.mask)) {
      return obj
    }
  }
  return null
}
