import { useState } from 'react'
import { useStorageStore } from '../stores/storageStore'
import { Sidebar } from '../components/Sidebar'
import { PhotoViewer } from '../components/PhotoViewer'
import { ObjectPopup } from '../components/ObjectPopup'
import { WarehouseDialog } from '../components/WarehouseDialog'
import { PhotoDialog } from '../components/PhotoDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ObjectForm } from '../components/ObjectForm'
import { ExportImportBar } from '../components/ExportImportBar'
import { ImportDialog } from '../components/ImportDialog'
import { exportData, importData, generateExportFileName } from '../utils/exportImport'
import type { StorageObject } from '../types/storage'

export function MainView() {
  const {
    warehouses,
    currentWarehouseId,
    currentPhotoId,
    selectedObjectId,
    setCurrentWarehouse,
    setCurrentPhoto,
    setViewMode,
    setSelectedObjectId,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addPhoto,
    updatePhoto,
    deletePhoto,
    updateObject,
    deleteObject,
    nextPhoto,
    prevPhoto,
    getAppData,
    setInitialData,
  } = useStorageStore()

  // ポップアップ・ダイアログ状態
  const [popupObject, setPopupObject] = useState<StorageObject | null>(null)
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false)
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [photoDialogWarehouseId, setPhotoDialogWarehouseId] = useState<string | null>(null)
  const [editingObject, setEditingObject] = useState<StorageObject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StorageObject | null>(null)
  const [deleteWarehouseTarget, setDeleteWarehouseTarget] = useState<string | null>(null)
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<{ warehouseId: string; photoId: string } | null>(null)
  const [editingPhotoTarget, setEditingPhotoTarget] = useState<{ warehouseId: string; photoId: string } | null>(null)
  const [editingPhotoName, setEditingPhotoName] = useState('')
  const [importJson, setImportJson] = useState<string | null>(null)

  // 現在の倉庫を取得
  const currentWarehouse = warehouses.find((w) => w.id === currentWarehouseId)

  // 現在の写真を取得
  const currentPhoto = currentWarehouse?.photos.find((p) => p.id === currentPhotoId)

  // 写真のインデックスを取得
  const currentPhotoIndex = currentWarehouse?.photos.findIndex((p) => p.id === currentPhotoId) ?? -1
  const hasPrev = currentPhotoIndex > 0
  const hasNext = currentWarehouse ? currentPhotoIndex < currentWarehouse.photos.length - 1 : false

  const handleSelectWarehouse = (id: string) => {
    setCurrentWarehouse(id)
  }

  const handleSelectPhoto = (warehouseId: string, photoId: string) => {
    setCurrentWarehouse(warehouseId)
    setCurrentPhoto(photoId)
    setPopupObject(null)
  }

  // 倉庫追加
  const handleAddWarehouse = () => {
    setEditingWarehouseId(null)
    setIsWarehouseDialogOpen(true)
  }

  const handleEditWarehouse = (id: string) => {
    setEditingWarehouseId(id)
    setIsWarehouseDialogOpen(true)
  }

  const handleSaveWarehouse = (name: string, memo: string) => {
    if (editingWarehouseId) {
      updateWarehouse(editingWarehouseId, { name, memo })
    } else {
      const id = addWarehouse(name, memo)
      setCurrentWarehouse(id)
    }
    setIsWarehouseDialogOpen(false)
    setEditingWarehouseId(null)
  }

  const handleDeleteWarehouseClick = (id: string) => {
    setDeleteWarehouseTarget(id)
  }

  const handleConfirmDeleteWarehouse = () => {
    if (deleteWarehouseTarget) {
      deleteWarehouse(deleteWarehouseTarget)
      setDeleteWarehouseTarget(null)
    }
  }

  // 写真追加
  const handleAddPhoto = (warehouseId: string) => {
    setPhotoDialogWarehouseId(warehouseId)
    setIsPhotoDialogOpen(true)
  }

  const handleSavePhoto = (name: string, imageDataUrl: string, width: number, height: number) => {
    if (photoDialogWarehouseId) {
      const photoId = addPhoto(photoDialogWarehouseId, name, imageDataUrl, width, height)
      setCurrentPhoto(photoId)
      setIsPhotoDialogOpen(false)
      setPhotoDialogWarehouseId(null)
    }
  }

  // 写真編集
  const handleEditPhoto = (warehouseId: string, photoId: string) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId)
    const photo = warehouse?.photos.find((p) => p.id === photoId)
    if (photo) {
      setEditingPhotoTarget({ warehouseId, photoId })
      setEditingPhotoName(photo.name)
    }
  }

  const handleSaveEditedPhoto = () => {
    if (editingPhotoTarget && editingPhotoName.trim()) {
      updatePhoto(editingPhotoTarget.warehouseId, editingPhotoTarget.photoId, { name: editingPhotoName.trim() })
      setEditingPhotoTarget(null)
      setEditingPhotoName('')
    }
  }

  const handleCancelEditPhoto = () => {
    setEditingPhotoTarget(null)
    setEditingPhotoName('')
  }

  // 写真削除
  const handleDeletePhotoClick = (warehouseId: string, photoId: string) => {
    setDeletePhotoTarget({ warehouseId, photoId })
  }

  const handleConfirmDeletePhoto = () => {
    if (deletePhotoTarget) {
      deletePhoto(deletePhotoTarget.warehouseId, deletePhotoTarget.photoId)
      setDeletePhotoTarget(null)
    }
  }

  // オブジェクト操作
  const handleObjectClick = (object: StorageObject) => {
    setSelectedObjectId(object.id)
    setPopupObject(object)
  }

  const handleClosePopup = () => {
    setPopupObject(null)
    setSelectedObjectId(null)
  }

  const handleEditObject = (object: StorageObject) => {
    setEditingObject(object)
    setPopupObject(null)
  }

  const handleSaveEditedObject = (name: string, memo: string) => {
    if (editingObject && currentWarehouseId && currentPhotoId) {
      updateObject(currentWarehouseId, currentPhotoId, editingObject.id, { name, memo })
      setEditingObject(null)
      setSelectedObjectId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingObject(null)
  }

  const handleDeleteObject = (object: StorageObject) => {
    setDeleteTarget(object)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget && currentWarehouseId && currentPhotoId) {
      deleteObject(currentWarehouseId, currentPhotoId, deleteTarget.id)
      setDeleteTarget(null)
      setPopupObject(null)
      setSelectedObjectId(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteTarget(null)
  }

  const handleSwitchToRegistration = () => {
    setViewMode('registration')
  }

  // エクスポート
  const handleExport = () => {
    const appData = getAppData()
    const json = exportData(appData)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generateExportFileName()
    a.click()
    URL.revokeObjectURL(url)
  }

  // インポート
  const handleImport = (json: string) => {
    // JSONを検証してからダイアログを表示
    try {
      JSON.parse(json)
      setImportJson(json)
    } catch {
      alert('JSONの解析に失敗しました')
    }
  }

  const handleImportOverwrite = () => {
    if (!importJson) return
    const existingData = getAppData()
    const result = importData(importJson, 'overwrite', existingData)
    if (result.success && result.data) {
      setInitialData(result.data)
    } else {
      alert(result.error || 'インポートに失敗しました')
    }
    setImportJson(null)
  }

  const handleImportMerge = () => {
    if (!importJson) return
    const existingData = getAppData()
    const result = importData(importJson, 'merge', existingData)
    if (result.success && result.data) {
      setInitialData(result.data)
    } else {
      alert(result.error || 'インポートに失敗しました')
    }
    setImportJson(null)
  }

  const handleImportCancel = () => {
    setImportJson(null)
  }

  return (
    <div className="flex h-screen">
      {/* サイドバー */}
      <Sidebar
        warehouses={warehouses}
        currentWarehouseId={currentWarehouseId}
        currentPhotoId={currentPhotoId}
        onSelectWarehouse={handleSelectWarehouse}
        onSelectPhoto={handleSelectPhoto}
        onAddWarehouse={handleAddWarehouse}
        onAddPhoto={handleAddPhoto}
        onEditWarehouse={handleEditWarehouse}
        onDeleteWarehouse={handleDeleteWarehouseClick}
        onEditPhoto={handleEditPhoto}
        onDeletePhoto={handleDeletePhotoClick}
      />

      {/* メインエリア */}
      <div className="flex-1 flex flex-col">
        {/* ツールバー */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
          <div className="text-gray-700 font-medium">
            {currentWarehouse?.name || 'are-doko'}
          </div>
          <div className="flex items-center gap-4">
            <ExportImportBar onExport={handleExport} onImport={handleImport} />
            <button
              onClick={handleSwitchToRegistration}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
            >
              登録モード
            </button>
          </div>
        </div>

        {/* 写真ビューアまたはプレースホルダー */}
        <div className="flex-1 relative">
          {currentPhoto ? (
            <PhotoViewer
              photo={currentPhoto}
              selectedObjectId={selectedObjectId}
              onObjectClick={handleObjectClick}
              onPrev={prevPhoto}
              onNext={nextPhoto}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
              写真を選択してください
            </div>
          )}

          {/* オブジェクトポップアップ */}
          {popupObject && !editingObject && (
            <div className="absolute top-4 right-4 z-10">
              <ObjectPopup
                object={popupObject}
                onEdit={handleEditObject}
                onDelete={handleDeleteObject}
                onClose={handleClosePopup}
              />
            </div>
          )}

          {/* オブジェクト編集フォーム */}
          {editingObject && (
            <div className="absolute top-4 right-4 z-10">
              <ObjectForm
                previewImageDataUrl={editingObject.clippedImageDataUrl}
                initialName={editingObject.name}
                initialMemo={editingObject.memo}
                onSave={handleSaveEditedObject}
                onCancel={handleCancelEdit}
              />
            </div>
          )}
        </div>
      </div>

      {/* 倉庫追加・編集ダイアログ */}
      <WarehouseDialog
        isOpen={isWarehouseDialogOpen}
        initialName={editingWarehouseId ? warehouses.find((w) => w.id === editingWarehouseId)?.name : ''}
        initialMemo={editingWarehouseId ? warehouses.find((w) => w.id === editingWarehouseId)?.memo : ''}
        onClose={() => {
          setIsWarehouseDialogOpen(false)
          setEditingWarehouseId(null)
        }}
        onSave={handleSaveWarehouse}
      />

      {/* 写真追加ダイアログ */}
      <PhotoDialog
        isOpen={isPhotoDialogOpen}
        onClose={() => {
          setIsPhotoDialogOpen(false)
          setPhotoDialogWarehouseId(null)
        }}
        onSave={handleSavePhoto}
      />

      {/* オブジェクト削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="オブジェクトの削除"
        message={`「${deleteTarget?.name}」を削除しますか？この操作は取り消せません。`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* 倉庫削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteWarehouseTarget !== null}
        title="倉庫の削除"
        message={(() => {
          const warehouse = warehouses.find((w) => w.id === deleteWarehouseTarget)
          if (!warehouse) return ''
          const photoCount = warehouse.photos.length
          const objectCount = warehouse.photos.reduce((sum, p) => sum + p.objects.length, 0)
          return `「${warehouse.name}」を削除しますか？写真${photoCount}件、オブジェクト${objectCount}件も削除されます。`
        })()}
        onConfirm={handleConfirmDeleteWarehouse}
        onCancel={() => setDeleteWarehouseTarget(null)}
      />

      {/* 写真削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deletePhotoTarget !== null}
        title="写真の削除"
        message={(() => {
          if (!deletePhotoTarget) return ''
          const warehouse = warehouses.find((w) => w.id === deletePhotoTarget.warehouseId)
          const photo = warehouse?.photos.find((p) => p.id === deletePhotoTarget.photoId)
          if (!photo) return ''
          const objectCount = photo.objects.length
          return `「${photo.name}」を削除しますか？オブジェクト${objectCount}件も削除されます。`
        })()}
        onConfirm={handleConfirmDeletePhoto}
        onCancel={() => setDeletePhotoTarget(null)}
      />

      {/* 写真名編集ダイアログ */}
      {editingPhotoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancelEditPhoto} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">写真名を編集</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEditedPhoto() }}>
              <div className="mb-4">
                <label htmlFor="photo-name" className="block text-sm font-medium text-gray-700 mb-1">
                  写真名
                </label>
                <input
                  id="photo-name"
                  type="text"
                  value={editingPhotoName}
                  onChange={(e) => setEditingPhotoName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEditPhoto}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!editingPhotoName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* インポートモード選択ダイアログ */}
      <ImportDialog
        isOpen={importJson !== null}
        onOverwrite={handleImportOverwrite}
        onMerge={handleImportMerge}
        onCancel={handleImportCancel}
      />
    </div>
  )
}
