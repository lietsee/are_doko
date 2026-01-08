import { useRef, useEffect } from 'react'
import type { Photo, StorageObject } from '../../types/storage'
import { useImageZoom } from '../../hooks/useImageZoom'
import { ZoomControls } from '../ZoomControls'

interface PhotoViewerProps {
  photo: Photo
  selectedObjectId?: string | null
  onObjectClick: (object: StorageObject) => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}

export function PhotoViewer({
  photo,
  selectedObjectId,
  onObjectClick,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: PhotoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scale, displayScale, isReady, zoomIn, zoomOut, resetZoom, handleWheel } = useImageZoom({
    imageWidth: photo.width,
    imageHeight: photo.height,
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

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <h3 className="text-white font-medium">{photo.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="前へ"
            className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            aria-label="次へ"
            className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* 写真エリア */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
      >
        {isReady && (
          <div
            className="relative"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
            }}
          >
            {/* 写真 */}
            <img
              src={photo.imageDataUrl}
              alt={photo.name}
              className="max-w-full max-h-full object-contain"
              style={{
                maxWidth: containerRef.current?.clientWidth,
                maxHeight: containerRef.current?.clientHeight,
              }}
              crossOrigin="anonymous"
              draggable={false}
            />

            {/* オブジェクトオーバーレイ */}
            {photo.objects.map((obj) => (
              <ObjectOverlay
                key={obj.id}
                object={obj}
                isSelected={selectedObjectId === obj.id}
                onClick={() => onObjectClick(obj)}
                fitScale={fitScale}
              />
            ))}
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

interface ObjectOverlayProps {
  object: StorageObject
  isSelected: boolean
  onClick: () => void
  fitScale: number  // transform内なのでfitScaleを使用
}

function ObjectOverlay({ object, isSelected, onClick, fitScale }: ObjectOverlayProps) {
  const { mask } = object

  if (mask.type === 'rect') {
    return (
      <button
        data-testid={`overlay-${object.id}`}
        onClick={onClick}
        className={`absolute cursor-pointer bg-blue-500/30 border-2 border-blue-500 hover:bg-blue-500/50 transition-colors ${
          isSelected ? 'ring-4 ring-yellow-400' : ''
        }`}
        style={{
          left: mask.x * fitScale,
          top: mask.y * fitScale,
          width: mask.width * fitScale,
          height: mask.height * fitScale,
        }}
        aria-label={object.name}
      />
    )
  }

  // ポリゴンの場合（SVGで描画）
  if (mask.type === 'polygon') {
    // スケール適用したポリゴン座標（fitScale基準）
    const scaledPoints = mask.points.map((p) => `${p.x * fitScale},${p.y * fitScale}`).join(' ')
    const minX = Math.min(...mask.points.map((p) => p.x)) * fitScale
    const minY = Math.min(...mask.points.map((p) => p.y)) * fitScale
    const maxX = Math.max(...mask.points.map((p) => p.x)) * fitScale
    const maxY = Math.max(...mask.points.map((p) => p.y)) * fitScale

    return (
      <button
        data-testid={`overlay-${object.id}`}
        onClick={onClick}
        className={`absolute cursor-pointer ${isSelected ? 'ring-4 ring-yellow-400' : ''}`}
        style={{
          left: minX,
          top: minY,
          width: maxX - minX,
          height: maxY - minY,
        }}
        aria-label={object.name}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        >
          <polygon
            points={scaledPoints}
            className="fill-blue-500/30 stroke-blue-500 stroke-2 hover:fill-blue-500/50 transition-colors"
          />
        </svg>
      </button>
    )
  }

  return null
}
