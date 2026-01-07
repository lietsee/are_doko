/**
 * LassoSelector - 投げ縄でオブジェクト検出
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import type { Position } from '../../utils/samApi'

interface LassoSelectorProps {
  imageDataUrl: string
  imageWidth: number
  imageHeight: number
  onSelect: (polygon: Position[]) => void
  onCancel: () => void
  isLoading?: boolean
  error?: string
}

export function LassoSelector({
  imageDataUrl,
  imageWidth,
  imageHeight,
  onSelect,
  onCancel,
  isLoading = false,
  error,
}: LassoSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<Position[]>([])
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)

  // 画像のロードと表示サイズ計算
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      const container = containerRef.current
      if (!container) return

      // コンテナに合わせてアスペクト比を維持
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

    // 投げ縄を描画
    if (points.length > 1) {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.stroke()

      // 塗りつぶし（半透明）
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'
      ctx.closePath()
      ctx.fill()
    }
  }, [points, displaySize])

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

  // マウス/タッチイベントハンドラ
  const getEventPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Position => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (isLoading) return
    e.preventDefault()
    setIsDrawing(true)
    const pos = getEventPosition(e)
    setPoints([pos])
  }

  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || isLoading) return
    e.preventDefault()
    const pos = getEventPosition(e)
    setPoints((prev) => [...prev, pos])
  }

  const handleEnd = () => {
    if (!isDrawing || isLoading) return
    setIsDrawing(false)

    // 最低3点必要
    if (points.length >= 3) {
      // 元画像座標に変換
      const imagePolygon = points.map((p) => toImageCoords(p.x, p.y))
      onSelect(imagePolygon)
    }
    setPoints([])
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-gray-900"
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`${isLoading ? 'opacity-50' : 'cursor-crosshair'}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* 説明テキスト */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
        ドラッグでオブジェクトを囲む
      </div>

      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white px-4 py-2 rounded shadow flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span>検出中...</span>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="absolute bottom-12 left-2 right-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
          {error}
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
    </div>
  )
}
