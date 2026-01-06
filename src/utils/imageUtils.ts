import type { RectMask } from '../types/storage'

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
