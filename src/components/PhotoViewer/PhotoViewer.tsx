import { useRef, useState, useEffect } from 'react'
import type { Photo, StorageObject } from '../../types/storage'

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
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)

  // 画像ロード・リサイズ時にスケール計算
  useEffect(() => {
    const updateScale = () => {
      if (imgRef.current && photo.width > 0) {
        const displayWidth = imgRef.current.clientWidth
        setScale(displayWidth / photo.width)
      }
    }

    // 画像ロード完了時
    const img = imgRef.current
    if (img) {
      if (img.complete) {
        updateScale()
      } else {
        img.addEventListener('load', updateScale)
      }
    }

    // リサイズ時
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
      img?.removeEventListener('load', updateScale)
    }
  }, [photo])

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
      <div className="flex-1 relative overflow-auto flex items-center justify-center">
        <div className="relative inline-block">
          {/* 写真 */}
          <img
            ref={imgRef}
            src={photo.imageDataUrl}
            alt={photo.name}
            className="max-w-full max-h-full object-contain"
          />

          {/* オブジェクトオーバーレイ */}
          {photo.objects.map((obj) => (
            <ObjectOverlay
              key={obj.id}
              object={obj}
              isSelected={selectedObjectId === obj.id}
              onClick={() => onObjectClick(obj)}
              scale={scale}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ObjectOverlayProps {
  object: StorageObject
  isSelected: boolean
  onClick: () => void
  scale: number
}

function ObjectOverlay({ object, isSelected, onClick, scale }: ObjectOverlayProps) {
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
          left: mask.x * scale,
          top: mask.y * scale,
          width: mask.width * scale,
          height: mask.height * scale,
        }}
        aria-label={object.name}
      />
    )
  }

  // ポリゴンの場合（SVGで描画）
  if (mask.type === 'polygon') {
    // スケール適用したポリゴン座標
    const scaledPoints = mask.points.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')
    const minX = Math.min(...mask.points.map((p) => p.x)) * scale
    const minY = Math.min(...mask.points.map((p) => p.y)) * scale
    const maxX = Math.max(...mask.points.map((p) => p.x)) * scale
    const maxY = Math.max(...mask.points.map((p) => p.y)) * scale

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
