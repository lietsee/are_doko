import { useState, useRef, useCallback } from 'react'

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

  const getRelativePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 }
      const rect = containerRef.current.getBoundingClientRect()
      const scaleX = imageWidth / rect.width
      const scaleY = imageHeight / rect.height
      return {
        x: Math.max(0, Math.min(imageWidth, (clientX - rect.left) * scaleX)),
        y: Math.max(0, Math.min(imageHeight, (clientY - rect.top) * scaleY)),
      }
    },
    [imageWidth, imageHeight]
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

  // 画面表示用のスケール計算
  const displayScale = containerRef.current
    ? Math.min(
        containerRef.current.clientWidth / imageWidth,
        containerRef.current.clientHeight / imageHeight,
        1
      )
    : 1

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
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        <div
          ref={containerRef}
          data-testid="rect-selector-canvas"
          className="relative cursor-crosshair select-none"
          style={{
            width: imageWidth * displayScale,
            height: imageHeight * displayScale,
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
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* 選択中の矩形 */}
          {currentRect && (
            <div
              data-testid="selection-rect"
              className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
              style={{
                left: currentRect.x * displayScale,
                top: currentRect.y * displayScale,
                width: currentRect.width * displayScale,
                height: currentRect.height * displayScale,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
