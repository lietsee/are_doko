import { useState, useRef, useCallback, useEffect } from 'react'
import { useImageZoom } from '../../hooks/useImageZoom'
import { ZoomControls } from '../ZoomControls'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface RectSelectorProps {
  imageDataUrl: string
  imageWidth: number
  imageHeight: number
  onSelect: (rect: Rect) => void
  onCancel: () => void
}

export function RectSelector({
  imageDataUrl,
  imageWidth,
  imageHeight,
  onSelect,
  onCancel,
}: RectSelectorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentRect, setCurrentRect] = useState<Rect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const { scale, displayScale, isReady, zoomIn, zoomOut, resetZoom, handleWheel } = useImageZoom({
    imageWidth,
    imageHeight,
    containerRef,
  })

  // fitScaleを計算（transform内の要素はfitScaleで位置計算）
  const fitScale = displayScale / scale

  // マウスホイールでズーム
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const getRelativePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!imageContainerRef.current) return { x: 0, y: 0 }
      const rect = imageContainerRef.current.getBoundingClientRect()
      return {
        x: Math.max(0, Math.min(imageWidth, (clientX - rect.left) / displayScale)),
        y: Math.max(0, Math.min(imageHeight, (clientY - rect.top) / displayScale)),
      }
    },
    [imageWidth, imageHeight, displayScale]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getRelativePosition(e.clientX, e.clientY)
    setStartPoint(pos)
    setIsDragging(true)
    setCurrentRect(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !startPoint) return

    const pos = getRelativePosition(e.clientX, e.clientY)
    const x = Math.min(startPoint.x, pos.x)
    const y = Math.min(startPoint.y, pos.y)
    const width = Math.abs(pos.x - startPoint.x)
    const height = Math.abs(pos.y - startPoint.y)

    setCurrentRect({ x, y, width, height })
  }

  const handleMouseUp = () => {
    if (currentRect && currentRect.width >= 5 && currentRect.height >= 5) {
      onSelect(currentRect)
    }
    setIsDragging(false)
    setStartPoint(null)
    setCurrentRect(null)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="text-white text-sm">
          ドラッグして範囲を選択してください
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
        >
          キャンセル
        </button>
      </div>

      {/* 選択エリア */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
      >
        {isReady && (
          <div
            ref={imageContainerRef}
            data-testid="rect-selector-canvas"
            className="relative cursor-crosshair select-none"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 画像 */}
            <img
              src={imageDataUrl}
              alt="選択対象"
              className="pointer-events-none"
              style={{
                maxWidth: containerRef.current?.clientWidth,
                maxHeight: containerRef.current?.clientHeight,
                objectFit: 'contain',
              }}
              crossOrigin="anonymous"
              draggable={false}
            />

            {/* 選択中の矩形（transform内なのでfitScaleで位置計算） */}
            {currentRect && (
              <div
                data-testid="selection-rect"
                className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                style={{
                  left: currentRect.x * fitScale,
                  top: currentRect.y * fitScale,
                  width: currentRect.width * fitScale,
                  height: currentRect.height * fitScale,
                }}
              />
            )}
          </div>
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
