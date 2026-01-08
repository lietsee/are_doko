/**
 * PolygonSelector - クリックで頂点を追加してポリゴン選択
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import type { Position } from '../../utils/samApi'
import { useImageZoom } from '../../hooks/useImageZoom'
import { ZoomControls } from '../ZoomControls'

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
  // 頂点は画像座標で保存
  const [vertices, setVertices] = useState<Position[]>([])
  const [mousePos, setMousePos] = useState<Position | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const { scale, displayScale, isReady, zoomIn, zoomOut, resetZoom, handleWheel } = useImageZoom({
    imageWidth,
    imageHeight,
    containerRef,
  })

  // マウスホイールでズーム
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // 画像のロード
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
    }
    img.src = imageDataUrl
  }, [imageDataUrl])

  // fitScaleを計算（displayScale / scale）- Canvas描画用
  const fitScale = displayScale / scale

  // Canvas表示サイズ（fitScaleベース - 画面フィット時のサイズ）
  const canvasWidth = imageWidth * fitScale
  const canvasHeight = imageHeight * fitScale

  // Canvasの描画
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !imageLoaded || canvasWidth === 0) return

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 画像を描画
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

    // 画像座標を表示座標に変換（fitScale基準）
    const toDisplay = (pos: Position): Position => ({
      x: pos.x * fitScale,
      y: pos.y * fitScale,
    })

    // ポリゴンの辺を描画
    if (vertices.length > 1) {
      ctx.beginPath()
      const first = toDisplay(vertices[0])
      ctx.moveTo(first.x, first.y)
      for (let i = 1; i < vertices.length; i++) {
        const v = toDisplay(vertices[i])
        ctx.lineTo(v.x, v.y)
      }
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // マウス位置への仮線を描画
    if (vertices.length > 0 && mousePos) {
      const lastVertex = toDisplay(vertices[vertices.length - 1])
      const mousePosDisplay = toDisplay(mousePos)
      ctx.beginPath()
      ctx.moveTo(lastVertex.x, lastVertex.y)
      ctx.lineTo(mousePosDisplay.x, mousePosDisplay.y)
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 頂点を描画
    vertices.forEach((v, i) => {
      const displayV = toDisplay(v)
      ctx.beginPath()
      ctx.arc(displayV.x, displayV.y, VERTEX_RADIUS, 0, Math.PI * 2)
      if (i === 0) {
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
  }, [vertices, canvasWidth, canvasHeight, mousePos, fitScale, imageLoaded])

  // クリック位置から画像座標を取得
  const getImageCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Position => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const displayX = e.clientX - rect.left
      const displayY = e.clientY - rect.top
      return {
        x: displayX / displayScale,
        y: displayY / displayScale,
      }
    },
    [displayScale]
  )

  // 頂点との距離を計算（表示座標で - transform後のスケールで計算）
  const distanceToVertex = (imagePos: Position, vertex: Position): number => {
    const dx = (imagePos.x - vertex.x) * displayScale
    const dy = (imagePos.y - vertex.y) * displayScale
    return Math.sqrt(dx ** 2 + dy ** 2)
  }

  // クリック処理
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getImageCoords(e)

    // 既存の頂点をクリックしたかチェック
    for (let i = 0; i < vertices.length; i++) {
      if (distanceToVertex(pos, vertices[i]) < VERTEX_RADIUS * 1.5) {
        if (i === 0 && vertices.length >= 3) {
          // 最初の頂点をクリック → ポリゴン確定
          onSelect(vertices)
          return
        } else {
          // その他の頂点をクリック → 削除
          setVertices((prev) => prev.filter((_, idx) => idx !== i))
          return
        }
      }
    }

    // 新しい頂点を追加（画像座標で保存）
    setVertices((prev) => [...prev, pos])
  }

  // マウス移動処理
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getImageCoords(e)
    setMousePos(pos)
  }

  const handleMouseLeave = () => {
    setMousePos(null)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="text-white text-sm">
          クリックで頂点追加 / 最初の頂点(オレンジ)で確定 / 頂点クリックで削除
        </div>
        <div className="flex gap-2">
          {vertices.length > 0 && (
            <span className="text-white text-sm px-2 py-1">
              頂点: {vertices.length}
            </span>
          )}
          {vertices.length > 0 && (
            <button
              type="button"
              onClick={() => setVertices([])}
              className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
            >
              クリア
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
          >
            キャンセル
          </button>
        </div>
      </div>

      {/* Canvas エリア */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
      >
        {isReady && (
          <canvas
            ref={canvasRef}
            className="cursor-crosshair"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
            }}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        )}
      </div>

      {/* ズームコントロール */}
      <ZoomControls
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
      />
    </div>
  )
}
