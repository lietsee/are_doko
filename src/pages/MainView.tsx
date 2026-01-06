import { useState } from 'react'
import { useStorageStore } from '../stores/storageStore'
import { Sidebar } from '../components/Sidebar'
import { PhotoViewer } from '../components/PhotoViewer'
import { ObjectPopup } from '../components/ObjectPopup'
import { WarehouseDialog } from '../components/WarehouseDialog'
import { PhotoDialog } from '../components/PhotoDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ObjectForm } from '../components/ObjectForm'
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
    addPhoto,
    updateObject,
    deleteObject,
    nextPhoto,
    prevPhoto,
  } = useStorageStore()

  // ポップアップ・ダイアログ状態
  const [popupObject, setPopupObject] = useState<StorageObject | null>(null)
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [photoDialogWarehouseId, setPhotoDialogWarehouseId] = useState<string | null>(null)
  const [editingObject, setEditingObject] = useState<StorageObject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StorageObject | null>(null)

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
    setIsWarehouseDialogOpen(true)
  }

  const handleSaveWarehouse = (name: string, memo: string) => {
    const id = addWarehouse(name, memo)
    setCurrentWarehouse(id)
    setIsWarehouseDialogOpen(false)
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
      />

      {/* メインエリア */}
      <div className="flex-1 flex flex-col">
        {/* ツールバー */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
          <div className="text-gray-700 font-medium">
            {currentWarehouse?.name || 'are-doko'}
          </div>
          <button
            onClick={handleSwitchToRegistration}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
          >
            登録モード
          </button>
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

      {/* 倉庫追加ダイアログ */}
      <WarehouseDialog
        isOpen={isWarehouseDialogOpen}
        onClose={() => setIsWarehouseDialogOpen(false)}
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

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="オブジェクトの削除"
        message={`「${deleteTarget?.name}」を削除しますか？この操作は取り消せません。`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  )
}
