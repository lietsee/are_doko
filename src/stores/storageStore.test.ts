import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useStorageStore } from './storageStore'

describe('storageStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-06T12:00:00.000Z'))
    // Reset store before each test
    useStorageStore.setState({
      warehouses: [],
      currentWarehouseId: null,
      currentPhotoId: null,
      selectedObjectId: null,
      viewMode: 'view',
      inputMode: 'rect',
      version: '1.0.0',
      createdAt: null,
      updatedAt: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('倉庫操作', () => {
    it('addWarehouse: 新しい倉庫を追加できる', () => {
      const store = useStorageStore.getState()
      const id = store.addWarehouse('第一倉庫', '倉庫のメモ')

      const state = useStorageStore.getState()
      expect(state.warehouses).toHaveLength(1)
      expect(state.warehouses[0].id).toBe(id)
      expect(state.warehouses[0].name).toBe('第一倉庫')
      expect(state.warehouses[0].memo).toBe('倉庫のメモ')
    })

    it('updateWarehouse: 倉庫の名前とメモを更新できる', () => {
      const store = useStorageStore.getState()
      const id = store.addWarehouse('旧名', '旧メモ')

      store.updateWarehouse(id, { name: '新名', memo: '新メモ' })

      const state = useStorageStore.getState()
      expect(state.warehouses[0].name).toBe('新名')
      expect(state.warehouses[0].memo).toBe('新メモ')
    })

    it('deleteWarehouse: 倉庫と関連する写真・オブジェクトを削除する', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      store.addPhoto(warehouseId, '写真', 'data:image/png;base64,xxx', 100, 100)

      expect(useStorageStore.getState().warehouses).toHaveLength(1)

      store.deleteWarehouse(warehouseId)

      expect(useStorageStore.getState().warehouses).toHaveLength(0)
    })

    it('deleteWarehouse: currentWarehouseIdがクリアされる', () => {
      const store = useStorageStore.getState()
      const id = store.addWarehouse('倉庫')
      store.setCurrentWarehouse(id)

      expect(useStorageStore.getState().currentWarehouseId).toBe(id)

      store.deleteWarehouse(id)

      expect(useStorageStore.getState().currentWarehouseId).toBeNull()
    })
  })

  describe('写真操作', () => {
    it('addPhoto: 倉庫に写真を追加できる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photoId = store.addPhoto(warehouseId, '棚上段', 'data:image/png;base64,xxx', 1920, 1080)

      const state = useStorageStore.getState()
      const warehouse = state.warehouses[0]
      expect(warehouse.photos).toHaveLength(1)
      expect(warehouse.photos[0].id).toBe(photoId)
      expect(warehouse.photos[0].name).toBe('棚上段')
    })

    it('updatePhoto: 写真の名前を更新できる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photoId = store.addPhoto(warehouseId, '旧名', 'data:image/png;base64,xxx', 100, 100)

      store.updatePhoto(warehouseId, photoId, { name: '新名' })

      const state = useStorageStore.getState()
      expect(state.warehouses[0].photos[0].name).toBe('新名')
    })

    it('deletePhoto: 写真と関連するオブジェクトを削除する', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photoId = store.addPhoto(warehouseId, '写真', 'data:image/png;base64,xxx', 100, 100)
      store.addObject(warehouseId, photoId, 'ハンマー', '', 'clip', { type: 'rect', x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5 })

      expect(useStorageStore.getState().warehouses[0].photos).toHaveLength(1)

      store.deletePhoto(warehouseId, photoId)

      expect(useStorageStore.getState().warehouses[0].photos).toHaveLength(0)
    })
  })

  describe('オブジェクト操作', () => {
    it('addObject: 写真にオブジェクトを追加できる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photoId = store.addPhoto(warehouseId, '写真', 'data:image/png;base64,xxx', 100, 100)

      const objectId = store.addObject(
        warehouseId,
        photoId,
        'ハンマー',
        '立てて保管',
        'data:image/png;base64,clip',
        { type: 'rect', x: 10, y: 20, width: 50, height: 30 },
        { x: 25, y: 35 }
      )

      const state = useStorageStore.getState()
      const obj = state.warehouses[0].photos[0].objects[0]
      expect(obj.id).toBe(objectId)
      expect(obj.name).toBe('ハンマー')
      expect(obj.memo).toBe('立てて保管')
    })

    it('updateObject: オブジェクトの名前とメモを更新できる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photoId = store.addPhoto(warehouseId, '写真', 'data:image/png;base64,xxx', 100, 100)
      const objectId = store.addObject(warehouseId, photoId, '旧名', '旧メモ', 'clip', { type: 'rect', x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5 })

      store.updateObject(warehouseId, photoId, objectId, { name: '新名', memo: '新メモ' })

      const state = useStorageStore.getState()
      const obj = state.warehouses[0].photos[0].objects[0]
      expect(obj.name).toBe('新名')
      expect(obj.memo).toBe('新メモ')
    })

    it('deleteObject: オブジェクトを削除できる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photoId = store.addPhoto(warehouseId, '写真', 'data:image/png;base64,xxx', 100, 100)
      const objectId = store.addObject(warehouseId, photoId, 'ハンマー', '', 'clip', { type: 'rect', x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5 })

      expect(useStorageStore.getState().warehouses[0].photos[0].objects).toHaveLength(1)

      store.deleteObject(warehouseId, photoId, objectId)

      expect(useStorageStore.getState().warehouses[0].photos[0].objects).toHaveLength(0)
    })
  })

  describe('ナビゲーション', () => {
    it('setCurrentWarehouse: 現在の倉庫を設定できる', () => {
      const store = useStorageStore.getState()
      const id = store.addWarehouse('倉庫')

      store.setCurrentWarehouse(id)

      expect(useStorageStore.getState().currentWarehouseId).toBe(id)
    })

    it('setCurrentPhoto: 現在の写真を設定できる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photoId = store.addPhoto(warehouseId, '写真', 'data:image/png;base64,xxx', 100, 100)

      store.setCurrentPhoto(photoId)

      expect(useStorageStore.getState().currentPhotoId).toBe(photoId)
    })

    it('nextPhoto: 次の写真に切り替えできる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photo1Id = store.addPhoto(warehouseId, '写真1', 'data:image/png;base64,xxx', 100, 100)
      const photo2Id = store.addPhoto(warehouseId, '写真2', 'data:image/png;base64,xxx', 100, 100)

      store.setCurrentWarehouse(warehouseId)
      store.setCurrentPhoto(photo1Id)

      store.nextPhoto()

      expect(useStorageStore.getState().currentPhotoId).toBe(photo2Id)
    })

    it('prevPhoto: 前の写真に切り替えできる', () => {
      const store = useStorageStore.getState()
      const warehouseId = store.addWarehouse('倉庫')
      const photo1Id = store.addPhoto(warehouseId, '写真1', 'data:image/png;base64,xxx', 100, 100)
      const photo2Id = store.addPhoto(warehouseId, '写真2', 'data:image/png;base64,xxx', 100, 100)

      store.setCurrentWarehouse(warehouseId)
      store.setCurrentPhoto(photo2Id)

      store.prevPhoto()

      expect(useStorageStore.getState().currentPhotoId).toBe(photo1Id)
    })
  })

  describe('UIステート', () => {
    it('setViewMode: 閲覧/登録モードを切り替えできる', () => {
      const store = useStorageStore.getState()

      expect(useStorageStore.getState().viewMode).toBe('view')

      store.setViewMode('registration')

      expect(useStorageStore.getState().viewMode).toBe('registration')
    })

    it('setSelectedObjectId: 選択オブジェクトを設定できる', () => {
      const store = useStorageStore.getState()

      store.setSelectedObjectId('obj-123')

      expect(useStorageStore.getState().selectedObjectId).toBe('obj-123')
    })

    it('setInputMode: 入力方式を切り替えできる', () => {
      const store = useStorageStore.getState()

      expect(useStorageStore.getState().inputMode).toBe('rect')

      store.setInputMode('sam')

      expect(useStorageStore.getState().inputMode).toBe('sam')
    })
  })

  describe('データ初期化', () => {
    it('setInitialData: 初期データを設定できる', () => {
      const store = useStorageStore.getState()
      const initialData = {
        version: '1.0.0',
        warehouses: [
          {
            id: 'w1',
            name: '倉庫1',
            memo: '',
            photos: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }

      store.setInitialData(initialData)

      const state = useStorageStore.getState()
      expect(state.warehouses).toHaveLength(1)
      expect(state.warehouses[0].name).toBe('倉庫1')
    })
  })
})
