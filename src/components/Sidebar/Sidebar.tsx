import type { Warehouse } from '../../types/storage'
import { useAuthStore } from '../../stores/authStore'

interface SidebarProps {
  warehouses: Warehouse[]
  currentWarehouseId: string | null
  currentPhotoId: string | null
  onSelectWarehouse: (id: string) => void
  onSelectPhoto: (warehouseId: string, photoId: string) => void
  onAddWarehouse: () => void
  onAddPhoto: (warehouseId: string) => void
  onEditWarehouse?: (id: string) => void
  onDeleteWarehouse?: (id: string) => void
  onEditPhoto?: (warehouseId: string, photoId: string) => void
  onDeletePhoto?: (warehouseId: string, photoId: string) => void
}

export function Sidebar({
  warehouses,
  currentWarehouseId,
  currentPhotoId,
  onSelectWarehouse,
  onSelectPhoto,
  onAddWarehouse,
  onAddPhoto,
  onEditWarehouse,
  onDeleteWarehouse,
  onEditPhoto,
  onDeletePhoto,
}: SidebarProps) {
  return (
    <aside className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">倉庫一覧</h2>
      </div>

      {/* 倉庫リスト */}
      <div className="flex-1 overflow-y-auto">
        {warehouses.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm">倉庫がありません</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {warehouses.map((warehouse) => (
              <li key={warehouse.id}>
                {/* 倉庫名 */}
                <div
                  className={`flex items-center px-4 py-3 hover:bg-gray-100 transition-colors ${
                    currentWarehouseId === warehouse.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <button
                    onClick={() => onSelectWarehouse(warehouse.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform mr-2 ${
                          currentWarehouseId === warehouse.id ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-medium text-gray-900">{warehouse.name}</span>
                    </div>
                  </button>
                  {onEditWarehouse && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditWarehouse(warehouse.id)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="倉庫を編集"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  {onDeleteWarehouse && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteWarehouse(warehouse.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="倉庫を削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 写真リスト（展開時） */}
                {currentWarehouseId === warehouse.id && (
                  <div className="bg-white">
                    <ul className="divide-y divide-gray-100">
                      {warehouse.photos.map((photo) => (
                        <li
                          key={photo.id}
                          className={`flex items-center px-6 py-2 hover:bg-gray-50 transition-colors ${currentPhotoId === photo.id ? 'bg-blue-100' : ''}`}
                        >
                          <button
                            onClick={() => onSelectPhoto(warehouse.id, photo.id)}
                            className="flex-1 text-left text-sm text-gray-700"
                          >
                            {photo.name}
                          </button>
                          {onEditPhoto && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditPhoto(warehouse.id, photo.id)
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="写真を編集"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                          {onDeletePhoto && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeletePhoto(warehouse.id, photo.id)
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="写真を削除"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* 写真追加ボタン */}
                    <button
                      onClick={() => onAddPhoto(warehouse.id)}
                      className="w-full text-left px-6 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      + 写真を追加
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 倉庫追加ボタン */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onAddWarehouse}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          倉庫を追加
        </button>
      </div>

      {/* ログアウトボタン */}
      <LogoutButton />
    </aside>
  )
}

function LogoutButton() {
  const { user, signOut } = useAuthStore()

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut()
    }
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="text-xs text-gray-500 mb-2 truncate" title={user?.email || ''}>
        {user?.email}
      </div>
      <button
        onClick={handleLogout}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
      >
        ログアウト
      </button>
    </div>
  )
}
