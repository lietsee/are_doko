/**
 * SAM (Segment Anything Model) API クライアント
 */

export interface Position {
  x: number
  y: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SegmentResult {
  polygon: Position[]
  bounding_box: BoundingBox
}

export interface SegmentError {
  error: string
  code: string
}

const SAM_API_URL = 'http://localhost:8000'

/**
 * SAMサーバーのヘルスチェック
 */
export async function checkSamHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SAM_API_URL}/health`, {
      method: 'GET',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * SAMでセグメンテーションを実行
 *
 * @param imageDataUrl - Base64エンコードされた画像（data URL形式）
 * @param clickX - クリックX座標（元画像ピクセル座標）
 * @param clickY - クリックY座標（元画像ピクセル座標）
 * @returns セグメンテーション結果
 * @throws SegmentError
 */
export async function segment(
  imageDataUrl: string,
  clickX: number,
  clickY: number
): Promise<SegmentResult> {
  // data URL から Base64 部分を抽出
  const base64Data = imageDataUrl.includes(',')
    ? imageDataUrl.split(',')[1]
    : imageDataUrl

  const response = await fetch(`${SAM_API_URL}/api/segment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: base64Data,
      click_x: Math.round(clickX),
      click_y: Math.round(clickY),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'サーバーエラーが発生しました',
      code: 'SERVER_ERROR',
    }))
    throw errorData.detail || errorData
  }

  return response.json()
}

/**
 * 投げ縄ポリゴンでSAMセグメンテーションを実行
 *
 * @param imageDataUrl - Base64エンコードされた画像（data URL形式）
 * @param lassoPolygon - 投げ縄ポリゴン
 * @returns セグメンテーション結果
 * @throws SegmentError
 */
export async function segmentWithLasso(
  imageDataUrl: string,
  lassoPolygon: Position[]
): Promise<SegmentResult> {
  // data URL から Base64 部分を抽出
  const base64Data = imageDataUrl.includes(',')
    ? imageDataUrl.split(',')[1]
    : imageDataUrl

  const response = await fetch(`${SAM_API_URL}/api/segment-lasso`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: base64Data,
      lasso_polygon: lassoPolygon.map((p) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      })),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'サーバーエラーが発生しました',
      code: 'SERVER_ERROR',
    }))
    throw errorData.detail || errorData
  }

  return response.json()
}

/**
 * ポリゴンからバウンディングボックスを計算
 */
export function polygonToBoundingBox(polygon: Position[]): BoundingBox {
  if (polygon.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = polygon[0].x
  let minY = polygon[0].y
  let maxX = polygon[0].x
  let maxY = polygon[0].y

  for (const point of polygon) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
