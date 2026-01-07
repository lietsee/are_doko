import { useState, useEffect } from 'react'
import { useStorageStore } from '../stores/storageStore'
import { Sidebar } from '../components/Sidebar'
import { RectSelector } from '../components/RectSelector'
import { SamSelector } from '../components/SamSelector'
import { LassoSelector } from '../components/LassoSelector'
import { ObjectForm } from '../components/ObjectForm'
import { WarehouseDialog } from '../components/WarehouseDialog'
import { PhotoDialog } from '../components/PhotoDialog'
import { ExportImportBar } from '../components/ExportImportBar'
import { clipImage, clipImageWithPolygon } from '../utils/imageUtils'
import { exportData, importData, generateExportFileName } from '../utils/exportImport'
import { segment, segmentWithLasso, checkSamHealth, polygonToBoundingBox } from '../utils/samApi'
import type { RectMask, PolygonMask } from '../types/storage'
import type { Position } from '../utils/samApi'

type InputMode = 'rect' | 'sam' | 'lasso'

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
    setCurrentWarehouse,
    setCurrentPhoto,
    setViewMode,
    addObject,
    addWarehouse,
    addPhoto,
    getAppData,
    setInitialData,
  } = useStorageStore()

  const [selectionState, setSelectionState] = useState<SelectionState | null>(null)
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [photoDialogWarehouseId, setPhotoDialogWarehouseId] = useState<string | null>(null)

  // SAM関連の状態
  const [inputMode, setInputMode] = useState<InputMode>('rect')
  const [samAvailable, setSamAvailable] = useState(false)
  const [samLoading, setSamLoading] = useState(false)
  const [samError, setSamError] = useState<string | undefined>()

  // SAMサーバーのヘルスチェック
  useEffect(() => {
    checkSamHealth().then(setSamAvailable)
  }, [])

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

  const handleSaveWarehouse = (name: string, memo: string) => {
    const id = addWarehouse(name, memo)
    setCurrentWarehouse(id)
    setIsWarehouseDialogOpen(false)
  }

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
    const existingData = getAppData()
    const result = importData(json, 'overwrite', existingData)
    if (result.success && result.data) {
      setInitialData(result.data)
    } else {
      alert(result.error || 'インポートに失敗しました')
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

  // SAMでの選択処理
  const handleSamSelect = async (clickX: number, clickY: number) => {
    if (!currentPhoto) return

    setSamLoading(true)
    setSamError(undefined)

    try {
      const result = await segment(currentPhoto.imageDataUrl, clickX, clickY)

      // ポリゴンマスクを作成
      const mask: PolygonMask = {
        type: 'polygon',
        points: result.polygon,
      }

      // ポリゴン形状で画像を切り出し（ポリゴン外は透明）
      const bbox = polygonToBoundingBox(result.polygon)
      const previewImageDataUrl = await clipImageWithPolygon(
        currentPhoto.imageDataUrl,
        result.polygon,
        bbox
      )

      const clickPoint = { x: clickX, y: clickY }
      setSelectionState({ mask, previewImageDataUrl, clickPoint })
    } catch (error) {
      const errorObj = error as { error?: string; code?: string }
      setSamError(errorObj.error || 'セグメンテーションに失敗しました')
    } finally {
      setSamLoading(false)
    }
  }

  // 投げ縄での選択処理
  const handleLassoSelect = async (lassoPolygon: Position[]) => {
    if (!currentPhoto) return

    setSamLoading(true)
    setSamError(undefined)

    try {
      const result = await segmentWithLasso(currentPhoto.imageDataUrl, lassoPolygon)

      // ポリゴンマスクを作成
      const mask: PolygonMask = {
        type: 'polygon',
        points: result.polygon,
      }

      // ポリゴン形状で画像を切り出し（ポリゴン外は透明）
      const bbox = polygonToBoundingBox(result.polygon)
      const previewImageDataUrl = await clipImageWithPolygon(
        currentPhoto.imageDataUrl,
        result.polygon,
        bbox
      )

      // クリックポイントは投げ縄の中心
      const centerX = lassoPolygon.reduce((sum, p) => sum + p.x, 0) / lassoPolygon.length
      const centerY = lassoPolygon.reduce((sum, p) => sum + p.y, 0) / lassoPolygon.length
      const clickPoint = { x: centerX, y: centerY }
      setSelectionState({ mask, previewImageDataUrl, clickPoint })
    } catch (error) {
      const errorObj = error as { error?: string; code?: string }
      setSamError(errorObj.error || 'セグメンテーションに失敗しました')
    } finally {
      setSamLoading(false)
    }
  }

  const handleCancelSelection = () => {
    setSelectionState(null)
    setSamError(undefined)
  }

  const handleSaveObject = (name: string, memo: string) => {
    if (!currentWarehouseId || !currentPhotoId || !selectionState) return

    addObject(
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
                onClick={() => setInputMode('sam')}
                disabled={!samAvailable}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode === 'sam'
                    ? 'bg-green-600 text-white'
                    : samAvailable
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                }`}
                title={samAvailable ? 'AI検出' : 'SAMサーバーに接続できません'}
              >
                AI検出
              </button>
              <button
                onClick={() => setInputMode('lasso')}
                disabled={!samAvailable}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode === 'lasso'
                    ? 'bg-green-600 text-white'
                    : samAvailable
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                }`}
                title={samAvailable ? '投げ縄' : 'SAMサーバーに接続できません'}
              >
                投げ縄
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ExportImportBar onExport={handleExport} onImport={handleImport} />
            <button
              onClick={handleSwitchToView}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              閲覧モード
            </button>
          </div>
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
          ) : inputMode === 'sam' ? (
            <SamSelector
              imageDataUrl={currentPhoto.imageDataUrl}
              imageWidth={currentPhoto.width}
              imageHeight={currentPhoto.height}
              onSelect={handleSamSelect}
              onCancel={handleSwitchToView}
              isLoading={samLoading}
              error={samError}
            />
          ) : inputMode === 'lasso' ? (
            <LassoSelector
              imageDataUrl={currentPhoto.imageDataUrl}
              imageWidth={currentPhoto.width}
              imageHeight={currentPhoto.height}
              onSelect={handleLassoSelect}
              onCancel={handleSwitchToView}
              isLoading={samLoading}
              error={samError}
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
    </div>
  )
}
