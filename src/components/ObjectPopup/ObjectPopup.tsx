import type { StorageObject } from '../../types/storage'

interface ObjectPopupProps {
  object: StorageObject
  onEdit: (object: StorageObject) => void
  onDelete: (object: StorageObject) => void
  onClose: () => void
}

export function ObjectPopup({ object, onEdit, onDelete, onClose }: ObjectPopupProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 min-w-64 max-w-sm">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{object.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* クリップ画像 */}
      <div className="mb-3">
        <img
          src={object.clippedImageDataUrl}
          alt={object.name}
          className="w-full h-auto rounded border border-gray-200"
        />
      </div>

      {/* メモ */}
      <div className="mb-4 text-sm text-gray-600">
        {object.memo || 'メモなし'}
      </div>

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(object)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
        >
          編集
        </button>
        <button
          onClick={() => onDelete(object)}
          className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
        >
          削除
        </button>
      </div>
    </div>
  )
}
