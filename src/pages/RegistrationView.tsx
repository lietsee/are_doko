import { useState } from 'react'
import { useStorageStore } from '../stores/storageStore'
import { Sidebar } from '../components/Sidebar'
import { RectSelector } from '../components/RectSelector'
import { PolygonSelector } from '../components/PolygonSelector'
import { ObjectForm } from '../components/ObjectForm'
import { WarehouseDialog } from '../components/WarehouseDialog'
import { PhotoDialog } from '../components/PhotoDialog'
import { ConflictDialog } from '../components/ConflictDialog'
import { clipImage, clipImageWithPolygon } from '../utils/imageUtils'
import { polygonToBoundingBox } from '../utils/samApi'
import type { RectMask, PolygonMask, Position } from '../types/storage'

type InputMode = 'rect' | 'polygon'

interface SelectionState {
  mask: RectMask | PolygonMask
  previewImageDataUrl: string
  clickPoint: { x: number; y: number }
}

export function RegistrationView() {
  const {
    warehouses,
    currentWarehouseId,
    currentPhotoId,
    versionConflict,
    setCurrentWarehouse,
    setCurrentPhoto,
    setViewMode,
    addObject,
    addWarehouse,
    addPhoto,
    loadWarehouses,
    clearVersionConflict,
  } = useStorageStore()

  const [selectionState, setSelectionState] = useState<SelectionState | null>(null)
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [photoDialogWarehouseId, setPhotoDialogWarehouseId] = useState<string | null>(null)

  // 入力モード（SAM無効化のため矩形とポリゴンのみ）
  const [inputMode, setInputMode] = useState<InputMode>('rect')

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
    setIsWarehouseDialogOpen(true)
  }

  const handleSaveWarehouse = async (name: string, memo: string) => {
    const id = await addWarehouse(name, memo)
    if (id) {
      setCurrentWarehouse(id)
    }
    setIsWarehouseDialogOpen(false)
  }

  const handleAddPhoto = (warehouseId: string) => {
    setPhotoDialogWarehouseId(warehouseId)
    setIsPhotoDialogOpen(true)
  }

  const handleSavePhoto = async (name: string, imageDataUrl: string, width: number, height: number) => {
    if (photoDialogWarehouseId) {
      const photoId = await addPhoto(photoDialogWarehouseId, name, imageDataUrl, width, height)
      if (photoId) {
        setCurrentPhoto(photoId)
      }
      setIsPhotoDialogOpen(false)
      setPhotoDialogWarehouseId(null)
    }
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
      setSelectionState({ mask, previewImageDataUrl, clickPoint })
    } catch (error) {
      console.error('Failed to clip image:', error)
    }
  }

  // ポリゴン選択処理
  const handlePolygonSelect = async (polygon: Position[]) => {
    if (!currentPhoto) return

    try {
      // ポリゴンマスクを作成
      const mask: PolygonMask = {
        type: 'polygon',
        points: polygon,
      }

      // ポリゴン形状で画像を切り出し
      const bbox = polygonToBoundingBox(polygon)
      const previewImageDataUrl = await clipImageWithPolygon(
        currentPhoto.imageDataUrl,
        polygon,
        bbox
      )

      // クリックポイントはポリゴンの中心
      const centerX = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length
      const centerY = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length
      const clickPoint = { x: centerX, y: centerY }
      setSelectionState({ mask, previewImageDataUrl, clickPoint })
    } catch (error) {
      console.error('Polygon selection error:', error)
    }
  }

  const handleCancelSelection = () => {
    setSelectionState(null)
  }

  const handleSaveObject = async (name: string, memo: string) => {
    if (!currentWarehouseId || !currentPhotoId || !selectionState) return

    await addObject(
      currentWarehouseId,
      currentPhotoId,
      name,
      memo,
      selectionState.previewImageDataUrl,
      selectionState.mask,
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
          <div className="flex items-center gap-4">
            <span className="text-green-800 font-medium">
              登録モード: {currentWarehouse?.name || 'are-doko'}
            </span>
            {/* 入力モード切り替え */}
            <div className="flex items-center gap-1 bg-white rounded px-1 py-0.5">
              <button
                onClick={() => setInputMode('rect')}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode === 'rect'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                矩形選択
              </button>
              <button
                onClick={() => setInputMode('polygon')}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode === 'polygon'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ポリゴン
              </button>
            </div>
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
          ) : inputMode === 'polygon' ? (
            <PolygonSelector
              imageDataUrl={currentPhoto.imageDataUrl}
              imageWidth={currentPhoto.width}
              imageHeight={currentPhoto.height}
              onSelect={handlePolygonSelect}
              onCancel={handleSwitchToView}
            />
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

      {/* バージョン競合ダイアログ */}
      <ConflictDialog
        isOpen={versionConflict !== null}
        onReload={async () => {
          await loadWarehouses()
          clearVersionConflict()
        }}
        onCancel={clearVersionConflict}
      />
    </div>
  )
}
