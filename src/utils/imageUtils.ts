import type { RectMask, Position, BoundingBox } from '../types/storage'

/**
 * 画像から指定された矩形領域を切り出してBase64形式で返す
 */
export async function clipImage(
  imageDataUrl: string,
  rect: RectMask
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(
        img,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      )
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = imageDataUrl
  })
}

/**
 * 画像からポリゴン形状で切り出してBase64形式で返す
 * ポリゴン外は透明になる
 */
export async function clipImageWithPolygon(
  imageDataUrl: string,
  polygon: Position[],
  boundingBox: BoundingBox
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (polygon.length < 3) {
      reject(new Error('Polygon must have at least 3 points'))
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = boundingBox.width
      canvas.height = boundingBox.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // ポリゴンパスを作成（バウンディングボックス座標系に変換）
      ctx.beginPath()
      const offsetX = boundingBox.x
      const offsetY = boundingBox.y
      ctx.moveTo(polygon[0].x - offsetX, polygon[0].y - offsetY)
      for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x - offsetX, polygon[i].y - offsetY)
      }
      ctx.closePath()

      // ポリゴン領域でクリッピング
      ctx.clip()

      // クリッピング領域内のみ描画
      ctx.drawImage(
        img,
        boundingBox.x,
        boundingBox.y,
        boundingBox.width,
        boundingBox.height,
        0,
        0,
        boundingBox.width,
        boundingBox.height
      )

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = imageDataUrl
  })
}
