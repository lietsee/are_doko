import { useState } from 'react'

interface ObjectFormProps {
  previewImageDataUrl: string
  initialName?: string
  initialMemo?: string
  onSave: (name: string, memo: string) => void
  onCancel: () => void
}

export function ObjectForm({
  previewImageDataUrl,
  initialName = '',
  initialMemo = '',
  onSave,
  onCancel,
}: ObjectFormProps) {
  const [name, setName] = useState(initialName)
  const [memo, setMemo] = useState(initialMemo)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim(), memo)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 min-w-72 max-w-md">
      {/* プレビュー画像 */}
      <div className="mb-4">
        <img
          src={previewImageDataUrl}
          alt="選択範囲のプレビュー"
          className="w-full h-auto rounded border border-gray-200"
        />
      </div>

      {/* 名前入力 */}
      <div className="mb-3">
        <label htmlFor="object-name" className="block text-sm font-medium text-gray-700 mb-1">
          名前
        </label>
        <input
          id="object-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="オブジェクト名を入力"
        />
      </div>

      {/* メモ入力 */}
      <div className="mb-4">
        <label htmlFor="object-memo" className="block text-sm font-medium text-gray-700 mb-1">
          メモ
        </label>
        <textarea
          id="object-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="保管場所のメモを入力"
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </form>
  )
}
