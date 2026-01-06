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
}

function ObjectOverlay({ object, isSelected, onClick }: ObjectOverlayProps) {
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
          left: mask.x,
          top: mask.y,
          width: mask.width,
          height: mask.height,
        }}
        aria-label={object.name}
      />
    )
  }

  // ポリゴンの場合（SVGで描画）
  if (mask.type === 'polygon') {
    const points = mask.points.map((p) => `${p.x},${p.y}`).join(' ')
    const minX = Math.min(...mask.points.map((p) => p.x))
    const minY = Math.min(...mask.points.map((p) => p.y))
    const maxX = Math.max(...mask.points.map((p) => p.x))
    const maxY = Math.max(...mask.points.map((p) => p.y))

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
            points={points}
            className="fill-blue-500/30 stroke-blue-500 stroke-2 hover:fill-blue-500/50 transition-colors"
          />
        </svg>
      </button>
    )
  }

  return null
}
