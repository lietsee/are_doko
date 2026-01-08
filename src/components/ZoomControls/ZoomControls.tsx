interface ZoomControlsProps {
  scale: number  // 1.0〜3.0
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100)
  const canZoomOut = scale > 1.05  // 1.0より大きい場合に縮小可能（浮動小数点対策）
  const canZoomIn = scale < 2.95   // 3.0未満の場合に拡大可能

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800">
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="ズームアウト"
      >
        −
      </button>
      <span className="min-w-[60px] text-center text-white text-sm">
        {percentage}%
      </span>
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="ズームイン"
      >
        +
      </button>
      <button
        onClick={onReset}
        className="px-3 py-1 text-white text-sm bg-gray-700 rounded hover:bg-gray-600"
        aria-label="リセット"
      >
        リセット
      </button>
    </div>
  )
}
