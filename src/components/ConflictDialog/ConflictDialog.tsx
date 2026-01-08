/**
 * バージョン競合ダイアログ
 * 他のユーザーがデータを更新した場合に表示
 */

interface ConflictDialogProps {
  isOpen: boolean
  onReload: () => void
  onCancel: () => void
}

export function ConflictDialog({ isOpen, onReload, onCancel }: ConflictDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="text-yellow-500 text-5xl mb-4">&#9888;</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            データが更新されました
          </h2>
          <p className="text-gray-600 mb-6">
            他のユーザーがデータを更新しました。
            <br />
            最新のデータを読み込んでください。
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={onReload}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
