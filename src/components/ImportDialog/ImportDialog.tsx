interface ImportDialogProps {
  isOpen: boolean
  onOverwrite: () => void
  onMerge: () => void
  onCancel: () => void
}

export function ImportDialog({
  isOpen,
  onOverwrite,
  onMerge,
  onCancel,
}: ImportDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* ダイアログ */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">データのインポート</h2>

        <p className="text-gray-600 mb-6">
          インポート方法を選択してください。
        </p>

        {/* オプション */}
        <div className="space-y-3 mb-6">
          <div className="p-3 border border-gray-200 rounded bg-gray-50">
            <div className="font-medium text-gray-900">上書き</div>
            <div className="text-sm text-gray-600">既存データを削除し、インポートデータで置き換えます</div>
          </div>
          <div className="p-3 border border-gray-200 rounded bg-gray-50">
            <div className="font-medium text-gray-900">マージ</div>
            <div className="text-sm text-gray-600">既存データに追加します（IDは新規生成）</div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onMerge}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
          >
            マージ
          </button>
          <button
            type="button"
            onClick={onOverwrite}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            上書き
          </button>
        </div>
      </div>
    </div>
  )
}
