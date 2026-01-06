import type { Warehouse } from '../../types/storage'

interface SidebarProps {
  warehouses: Warehouse[]
  currentWarehouseId: string | null
  currentPhotoId: string | null
  onSelectWarehouse: (id: string) => void
  onSelectPhoto: (warehouseId: string, photoId: string) => void
  onAddWarehouse: () => void
  onAddPhoto: (warehouseId: string) => void
}

export function Sidebar({
  warehouses,
  currentWarehouseId,
  currentPhotoId,
  onSelectWarehouse,
  onSelectPhoto,
  onAddWarehouse,
  onAddPhoto,
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
                <button
                  onClick={() => onSelectWarehouse(warehouse.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                    currentWarehouseId === warehouse.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{warehouse.name}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        currentWarehouseId === warehouse.id ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* 写真リスト（展開時） */}
                {currentWarehouseId === warehouse.id && (
                  <div className="bg-white">
                    <ul className="divide-y divide-gray-100">
                      {warehouse.photos.map((photo) => (
                        <li
                          key={photo.id}
                          className={`${currentPhotoId === photo.id ? 'bg-blue-100' : ''}`}
                        >
                          <button
                            onClick={() => onSelectPhoto(warehouse.id, photo.id)}
                            className="w-full text-left px-6 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {photo.name}
                          </button>
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
    </aside>
  )
}
