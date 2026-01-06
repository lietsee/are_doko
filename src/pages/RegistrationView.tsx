import { useState } from 'react'
import { useStorageStore } from '../stores/storageStore'
import { Sidebar } from '../components/Sidebar'
import { RectSelector } from '../components/RectSelector'
import { ObjectForm } from '../components/ObjectForm'
import { clipImage } from '../utils/imageUtils'
import type { RectMask } from '../types/storage'

interface SelectionState {
  rect: RectMask
  previewImageDataUrl: string
  clickPoint: { x: number; y: number }
}

export function RegistrationView() {
  const {
    warehouses,
    currentWarehouseId,
    currentPhotoId,
    setCurrentWarehouse,
    setCurrentPhoto,
    setViewMode,
    addObject,
  } = useStorageStore()

  const [selectionState, setSelectionState] = useState<SelectionState | null>(null)

  // 現在の倉庫を取得
  const currentWarehouse = warehouses.find((w) => w.id === currentWarehouseId)

  // 現在の写真を取得
  const currentPhoto = currentWarehouse?.photos.find((p) => p.id === currentPhotoId)

  const handleSelectWarehouse = (id: string) => {
    setCurrentWarehouse(id)
    setSelectionState(null)
  }

  const handleSelectPhoto = (warehouseId: string, photoId: string) => {
    setCurrentWarehouse(warehouseId)
    setCurrentPhoto(photoId)
    setSelectionState(null)
  }

  const handleAddWarehouse = () => {
    // TODO: 倉庫追加ダイアログを表示
    console.log('Add warehouse')
  }

  const handleAddPhoto = (warehouseId: string) => {
    // TODO: 写真追加処理
    console.log('Add photo to', warehouseId)
  }

  const handleRectSelect = async (rect: { x: number; y: number; width: number; height: number }) => {
    if (!currentPhoto) return

    try {
      const mask: RectMask = {
        type: 'rect',
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }
      const previewImageDataUrl = await clipImage(currentPhoto.imageDataUrl, mask)
      const clickPoint = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      }
      setSelectionState({ rect: mask, previewImageDataUrl, clickPoint })
    } catch (error) {
      console.error('Failed to clip image:', error)
    }
  }

  const handleCancelSelection = () => {
    setSelectionState(null)
  }

  const handleSaveObject = (name: string, memo: string) => {
    if (!currentWarehouseId || !currentPhotoId || !selectionState) return

    addObject(
      currentWarehouseId,
      currentPhotoId,
      name,
      memo,
      selectionState.previewImageDataUrl,
      selectionState.rect,
      selectionState.clickPoint
    )
    setSelectionState(null)
  }

  const handleSwitchToView = () => {
    setViewMode('view')
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
        <div className="flex items-center justify-between px-4 py-2 bg-green-100 border-b border-green-200">
          <div className="text-green-800 font-medium">
            登録モード: {currentWarehouse?.name || 'are-doko'}
          </div>
          <button
            onClick={handleSwitchToView}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
          >
            閲覧モード
          </button>
        </div>

        {/* 選択エリアまたはフォーム */}
        <div className="flex-1 relative">
          {!currentPhoto ? (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
              写真を選択してください
            </div>
          ) : selectionState ? (
            <div className="flex items-center justify-center h-full bg-gray-900 p-4">
              <ObjectForm
                previewImageDataUrl={selectionState.previewImageDataUrl}
                onSave={handleSaveObject}
                onCancel={handleCancelSelection}
              />
            </div>
          ) : (
            <RectSelector
              imageDataUrl={currentPhoto.imageDataUrl}
              imageWidth={currentPhoto.width}
              imageHeight={currentPhoto.height}
              onSelect={handleRectSelect}
              onCancel={handleSwitchToView}
            />
          )}
        </div>
      </div>
    </div>
  )
}
