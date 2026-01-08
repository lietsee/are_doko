/**
 * PolygonSelector - クリックで頂点を追加してポリゴン選択
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import type { Position } from '../../utils/samApi'

interface PolygonSelectorProps {
  imageDataUrl: string
  imageWidth: number
  imageHeight: number
  onSelect: (polygon: Position[]) => void
  onCancel: () => void
}

const VERTEX_RADIUS = 8 // 頂点の半径（ピクセル）

export function PolygonSelector({
  imageDataUrl,
  imageWidth,
  imageHeight,
  onSelect,
  onCancel,
}: PolygonSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [vertices, setVertices] = useState<Position[]>([])
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [mousePos, setMousePos] = useState<Position | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // 画像のロードと表示サイズ計算
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const imgAspect = imageWidth / imageHeight
      const containerAspect = containerWidth / containerHeight

      let displayWidth: number
      let displayHeight: number

      if (imgAspect > containerAspect) {
        displayWidth = containerWidth
        displayHeight = containerWidth / imgAspect
      } else {
        displayHeight = containerHeight
        displayWidth = containerHeight * imgAspect
      }

      setDisplaySize({ width: displayWidth, height: displayHeight })
    }
    img.src = imageDataUrl
  }, [imageDataUrl, imageWidth, imageHeight])

  // Canvasの描画
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || displaySize.width === 0) return

    canvas.width = displaySize.width
    canvas.height = displaySize.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 画像を描画
    ctx.drawImage(img, 0, 0, displaySize.width, displaySize.height)

    // ポリゴンの辺を描画
    if (vertices.length > 1) {
      ctx.beginPath()
      ctx.moveTo(vertices[0].x, vertices[0].y)
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y)
      }
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // マウス位置への仮線を描画
    if (vertices.length > 0 && mousePos) {
      ctx.beginPath()
      ctx.moveTo(vertices[vertices.length - 1].x, vertices[vertices.length - 1].y)
      ctx.lineTo(mousePos.x, mousePos.y)
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 頂点を描画
    vertices.forEach((v, i) => {
      ctx.beginPath()
      ctx.arc(v.x, v.y, VERTEX_RADIUS, 0, Math.PI * 2)
      if (i === 0) {
        // 最初の頂点は特別な色
        ctx.fillStyle = '#f59e0b'
        ctx.strokeStyle = '#d97706'
      } else {
        ctx.fillStyle = '#22c55e'
        ctx.strokeStyle = '#16a34a'
      }
      ctx.fill()
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [vertices, displaySize, mousePos])

  // 表示座標を元画像座標に変換
  const toImageCoords = useCallback(
    (displayX: number, displayY: number): Position => {
      const scaleX = imageWidth / displaySize.width
      const scaleY = imageHeight / displaySize.height
      return {
        x: displayX * scaleX,
        y: displayY * scaleY,
      }
    },
    [imageWidth, imageHeight, displaySize]
  )

  // クリック位置の取得
  const getClickPosition = (e: React.MouseEvent<HTMLCanvasElement>): Position => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // 頂点との距離を計算
  const distanceToVertex = (pos: Position, vertex: Position): number => {
    return Math.sqrt((pos.x - vertex.x) ** 2 + (pos.y - vertex.y) ** 2)
  }

  // クリック処理
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getClickPosition(e)

    // 既存の頂点をクリックしたかチェック
    for (let i = 0; i < vertices.length; i++) {
      if (distanceToVertex(pos, vertices[i]) < VERTEX_RADIUS * 1.5) {
        if (i === 0 && vertices.length >= 3) {
          // 最初の頂点をクリック → ポリゴン確定
          const imagePolygon = vertices.map((v) => toImageCoords(v.x, v.y))
          onSelect(imagePolygon)
          return
        } else {
          // その他の頂点をクリック → 削除
          setVertices((prev) => prev.filter((_, idx) => idx !== i))
          return
        }
      }
    }

    // 新しい頂点を追加
    setVertices((prev) => [...prev, pos])
  }

  // マウス移動処理
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getClickPosition(e)
    setMousePos(pos)
  }

  const handleMouseLeave = () => {
    setMousePos(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-gray-900"
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="cursor-crosshair"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* 説明テキスト */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
        クリックで頂点追加 / 最初の頂点(オレンジ)で確定 / 頂点クリックで削除
      </div>

      {/* 頂点数表示 */}
      {vertices.length > 0 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
          頂点: {vertices.length}
        </div>
      )}

      {/* キャンセルボタン */}
      <div className="absolute bottom-2 left-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          キャンセル
        </button>
      </div>

      {/* リセットボタン */}
      {vertices.length > 0 && (
        <div className="absolute bottom-2 right-2">
          <button
            type="button"
            onClick={() => setVertices([])}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            リセット
          </button>
        </div>
      )}
    </div>
  )
}
