import { useState, useRef } from 'react'

interface PhotoDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, imageDataUrl: string, width: number, height: number) => void
}

export function PhotoDialog({ isOpen, onClose, onSave }: PhotoDialogProps) {
  const [name, setName] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) {
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setImageDataUrl(dataUrl)

      // 画像サイズを取得
      const img = new Image()
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height })
      }
      img.src = dataUrl

      // ファイル名から拡張子を除いて写真名の初期値にする
      if (!name) {
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        setName(baseName)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (imageDataUrl && imageSize && name.trim()) {
      onSave(name.trim(), imageDataUrl, imageSize.width, imageSize.height)
      // リセット
      setName('')
      setImageDataUrl(null)
      setImageSize(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClose = () => {
    setName('')
    setImageDataUrl(null)
    setImageSize(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const canSave = imageDataUrl && imageSize && name.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* ダイアログ */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">写真を追加</h2>

        <form onSubmit={handleSubmit}>
          {/* ファイル選択 */}
          <div className="mb-4">
            <label
              htmlFor="photo-file"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              画像ファイル
            </label>
            <input
              ref={fileInputRef}
              id="photo-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* プレビュー */}
          {imageDataUrl && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">プレビュー</p>
              <img
                src={imageDataUrl}
                alt="プレビュー"
                className="max-h-48 rounded border border-gray-200"
              />
              {imageSize && (
                <p className="text-xs text-gray-500 mt-1">
                  {imageSize.width} x {imageSize.height} px
                </p>
              )}
            </div>
          )}

          {/* 写真名 */}
          <div className="mb-6">
            <label
              htmlFor="photo-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              写真名
            </label>
            <input
              id="photo-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="写真の名前を入力"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
