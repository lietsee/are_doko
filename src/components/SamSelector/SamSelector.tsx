/**
 * SAMセレクター - クリックでオブジェクト検出
 */

interface SamSelectorProps {
  imageDataUrl: string
  imageWidth: number
  imageHeight: number
  onSelect: (clickX: number, clickY: number) => void
  onCancel: () => void
  isLoading?: boolean
  error?: string
}

export function SamSelector({
  imageDataUrl,
  imageWidth,
  imageHeight,
  onSelect,
  onCancel,
  isLoading = false,
  error,
}: SamSelectorProps) {
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isLoading) return

    const img = e.currentTarget
    const rect = img.getBoundingClientRect()

    // クリック位置を元画像の座標に変換
    const scaleX = imageWidth / rect.width
    const scaleY = imageHeight / rect.height

    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    onSelect(clickX, clickY)
  }

  return (
    <div className="relative">
      {/* 画像 */}
      <img
        src={imageDataUrl}
        alt="選択対象の画像"
        className={`max-w-full h-auto ${isLoading ? 'opacity-50' : 'cursor-crosshair'}`}
        onClick={handleImageClick}
      />

      {/* 説明テキスト */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
        クリックしてオブジェクトを検出
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
