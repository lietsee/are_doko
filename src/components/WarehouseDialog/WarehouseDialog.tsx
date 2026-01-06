import { useState, useEffect } from 'react'

interface WarehouseDialogProps {
  isOpen: boolean
  initialName?: string
  initialMemo?: string
  onClose: () => void
  onSave: (name: string, memo: string) => void
}

export function WarehouseDialog({
  isOpen,
  initialName = '',
  initialMemo = '',
  onClose,
  onSave,
}: WarehouseDialogProps) {
  const [name, setName] = useState(initialName)
  const [memo, setMemo] = useState(initialMemo)

  const isEditing = initialName !== ''

  // ダイアログが開いたときに初期値をリセット
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setMemo(initialMemo)
    }
  }, [isOpen, initialName, initialMemo])

  if (!isOpen) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim(), memo)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* ダイアログ */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isEditing ? '倉庫を編集' : '倉庫を追加'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 倉庫名 */}
          <div className="mb-4">
            <label
              htmlFor="warehouse-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              倉庫名
            </label>
            <input
              id="warehouse-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="倉庫名を入力"
              autoFocus
            />
          </div>

          {/* メモ */}
          <div className="mb-6">
            <label
              htmlFor="warehouse-memo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メモ
            </label>
            <textarea
              id="warehouse-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="メモを入力（任意）"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
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
