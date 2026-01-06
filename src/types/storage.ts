/**
 * 座標 (元画像のピクセル座標、左上原点)
 */
export interface Position {
  x: number
  y: number
}

/**
 * バウンディングボックス
 */
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * ポリゴンマスク (SAM検出結果)
 */
export interface PolygonMask {
  type: 'polygon'
  points: Position[]
}

/**
 * 矩形マスク (手動選択)
 */
export interface RectMask {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

/**
 * オブジェクトマスク (クリック領域)
 */
export type ObjectMask = PolygonMask | RectMask

/**
 * 保管オブジェクト (道具など)
 */
export interface StorageObject {
  id: string
  name: string
  memo: string
  clippedImageDataUrl: string
  mask: ObjectMask
  clickPoint: Position
  createdAt: string
  updatedAt: string
}

/**
 * 写真
 */
export interface Photo {
  id: string
  name: string
  imageDataUrl: string
  width: number
  height: number
  objects: StorageObject[]
  createdAt: string
  updatedAt: string
}

/**
 * 倉庫
 */
export interface Warehouse {
  id: string
  name: string
  memo: string
  photos: Photo[]
  createdAt: string
  updatedAt: string
}

/**
 * アプリ全体データ
 */
export interface AppData {
  version: string
  warehouses: Warehouse[]
  createdAt: string | null
  updatedAt: string | null
}

/**
 * 表示モード
 */
export type ViewMode = 'view' | 'registration'

/**
 * 入力方式
 */
export type InputMode = 'sam' | 'rect'
