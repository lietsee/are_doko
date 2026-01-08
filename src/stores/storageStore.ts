/**
 * ストレージストア（API連携版）
 */

import { create } from 'zustand'
import type { Warehouse, Photo, StorageObject, ViewMode, InputMode, ObjectMask, Position } from '../types/storage'
import * as warehousesApi from '../api/warehouses'
import * as photosApi from '../api/photos'
import * as objectsApi from '../api/objects'
import { ApiError } from '../api/client'

interface StorageState {
  // Data
  warehouses: Warehouse[]
  loading: boolean
  error: string | null

  // Version conflict
  versionConflict: {
    type: 'warehouse' | 'photo' | 'object'
    id: string
    serverData: unknown
  } | null

  // UI State
  currentWarehouseId: string | null
  currentPhotoId: string | null
  selectedObjectId: string | null
  viewMode: ViewMode
  inputMode: InputMode
}

interface StorageActions {
  // Data loading
  loadWarehouses: () => Promise<void>
  loadPhotos: (warehouseId: string) => Promise<void>
  loadObjects: (photoId: string) => Promise<void>

  // Warehouse CRUD
  addWarehouse: (name: string, memo?: string) => Promise<string | null>
  updateWarehouse: (id: string, updates: Partial<Pick<Warehouse, 'name' | 'memo'>>) => Promise<boolean>
  deleteWarehouse: (id: string) => Promise<boolean>

  // Photo CRUD
  addPhoto: (warehouseId: string, name: string, imageDataUrl: string, width: number, height: number) => Promise<string | null>
  updatePhoto: (warehouseId: string, photoId: string, updates: Partial<Pick<Photo, 'name'>>) => Promise<boolean>
  deletePhoto: (warehouseId: string, photoId: string) => Promise<boolean>

  // Object CRUD
  addObject: (
    warehouseId: string,
    photoId: string,
    name: string,
    memo: string,
    clippedImageDataUrl: string,
    mask: ObjectMask,
    clickPoint: Position
  ) => Promise<string | null>
  updateObject: (
    warehouseId: string,
    photoId: string,
    objectId: string,
    updates: Partial<Pick<StorageObject, 'name' | 'memo'>>
  ) => Promise<boolean>
  deleteObject: (warehouseId: string, photoId: string, objectId: string) => Promise<boolean>

  // Navigation
  setCurrentWarehouse: (id: string | null) => void
  setCurrentPhoto: (id: string | null) => void
  nextPhoto: () => void
  prevPhoto: () => void

  // UI State
  setViewMode: (mode: ViewMode) => void
  setSelectedObjectId: (id: string | null) => void
  setInputMode: (mode: InputMode) => void

  // Error handling
  clearError: () => void
  clearVersionConflict: () => void
  forceUpdate: () => Promise<boolean>
}

/**
 * APIレスポンスからWarehouseに変換（photosなし）
 */
function toWarehouse(res: warehousesApi.WarehouseResponse): Warehouse {
  return {
    id: res.id,
    name: res.name,
    memo: res.memo,
    photos: [],
    createdAt: res.created_at,
    updatedAt: res.updated_at,
    version: res.version,
  }
}

/**
 * APIレスポンスからPhotoに変換（objectsなし）
 */
function toPhoto(res: photosApi.PhotoResponse): Photo {
  return {
    id: res.id,
    name: res.name,
    imageDataUrl: res.image_url,
    width: res.width,
    height: res.height,
    objects: [],
    createdAt: res.created_at,
    updatedAt: res.updated_at,
    version: res.version,
  }
}

/**
 * APIレスポンスからStorageObjectに変換
 */
function toStorageObject(res: objectsApi.ObjectResponse): StorageObject {
  // APIレスポンスのmask_dataは { points: [...] } または { x, y, width, height } 形式
  const maskData = res.mask_data as Record<string, unknown>
  const mask: ObjectMask = res.mask_type === 'polygon'
    ? { type: 'polygon', points: maskData.points as Position[] }
    : { type: 'rect', ...(maskData as { x: number; y: number; width: number; height: number }) }

  return {
    id: res.id,
    name: res.name,
    memo: res.memo,
    clippedImageDataUrl: res.clipped_image_url,
    mask,
    clickPoint: res.click_point,
    createdAt: res.created_at,
    updatedAt: res.updated_at,
    version: res.version,
  }
}

export const useStorageStore = create<StorageState & StorageActions>((set, get) => ({
  // Initial state
  warehouses: [],
  loading: false,
  error: null,
  versionConflict: null,
  currentWarehouseId: null,
  currentPhotoId: null,
  selectedObjectId: null,
  viewMode: 'view',
  inputMode: 'rect',

  // Data loading
  loadWarehouses: async () => {
    set({ loading: true, error: null })
    try {
      const res = await warehousesApi.fetchWarehouses()
      const warehouses = res.map(toWarehouse)
      set({ warehouses, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load warehouses'
      set({ error: message, loading: false })
    }
  },

  loadPhotos: async (warehouseId) => {
    set({ loading: true, error: null })
    try {
      const res = await photosApi.fetchPhotos(warehouseId)
      const photos = res.map(toPhoto)
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === warehouseId ? { ...w, photos } : w
        ),
        loading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load photos'
      set({ error: message, loading: false })
    }
  },

  loadObjects: async (photoId) => {
    set({ loading: true, error: null })
    try {
      const res = await objectsApi.fetchObjects(photoId)
      const objects = res.map(toStorageObject)
      set((state) => ({
        warehouses: state.warehouses.map((w) => ({
          ...w,
          photos: w.photos.map((p) =>
            p.id === photoId ? { ...p, objects } : p
          ),
        })),
        loading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load objects'
      set({ error: message, loading: false })
    }
  },

  // Warehouse CRUD
  addWarehouse: async (name, memo = '') => {
    set({ loading: true, error: null })
    try {
      const res = await warehousesApi.createWarehouse({ name, memo })
      const warehouse = toWarehouse(res)
      set((state) => ({
        warehouses: [...state.warehouses, warehouse],
        loading: false,
      }))
      return warehouse.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create warehouse'
      set({ error: message, loading: false })
      return null
    }
  },

  updateWarehouse: async (id, updates) => {
    const state = get()
    const warehouse = state.warehouses.find((w) => w.id === id)
    if (!warehouse) return false

    set({ loading: true, error: null })
    try {
      const res = await warehousesApi.updateWarehouse(id, {
        ...updates,
        version: warehouse.version,
      })
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === id
            ? { ...w, ...updates, version: res.version, updatedAt: res.updated_at }
            : w
        ),
        loading: false,
      }))
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        set({
          versionConflict: { type: 'warehouse', id, serverData: err.serverData },
          loading: false,
        })
        return false
      }
      const message = err instanceof Error ? err.message : 'Failed to update warehouse'
      set({ error: message, loading: false })
      return false
    }
  },

  deleteWarehouse: async (id) => {
    set({ loading: true, error: null })
    try {
      await warehousesApi.deleteWarehouse(id)
      set((state) => ({
        warehouses: state.warehouses.filter((w) => w.id !== id),
        currentWarehouseId: state.currentWarehouseId === id ? null : state.currentWarehouseId,
        currentPhotoId: state.warehouses.find((w) => w.id === id)?.photos.some((p) => p.id === state.currentPhotoId)
          ? null
          : state.currentPhotoId,
        loading: false,
      }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete warehouse'
      set({ error: message, loading: false })
      return false
    }
  },

  // Photo CRUD
  addPhoto: async (warehouseId, name, imageDataUrl, width, height) => {
    set({ loading: true, error: null })
    try {
      const res = await photosApi.createPhoto(warehouseId, {
        name,
        image_data_url: imageDataUrl,
        width,
        height,
      })
      const photo = toPhoto(res)
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === warehouseId
            ? { ...w, photos: [...w.photos, photo] }
            : w
        ),
        loading: false,
      }))
      return photo.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create photo'
      set({ error: message, loading: false })
      return null
    }
  },

  updatePhoto: async (warehouseId, photoId, updates) => {
    const state = get()
    const warehouse = state.warehouses.find((w) => w.id === warehouseId)
    const photo = warehouse?.photos.find((p) => p.id === photoId)
    if (!photo) return false

    set({ loading: true, error: null })
    try {
      const res = await photosApi.updatePhoto(photoId, {
        ...updates,
        version: photo.version,
      })
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === warehouseId
            ? {
                ...w,
                photos: w.photos.map((p) =>
                  p.id === photoId
                    ? { ...p, ...updates, version: res.version, updatedAt: res.updated_at }
                    : p
                ),
              }
            : w
        ),
        loading: false,
      }))
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        set({
          versionConflict: { type: 'photo', id: photoId, serverData: err.serverData },
          loading: false,
        })
        return false
      }
      const message = err instanceof Error ? err.message : 'Failed to update photo'
      set({ error: message, loading: false })
      return false
    }
  },

  deletePhoto: async (warehouseId, photoId) => {
    set({ loading: true, error: null })
    try {
      await photosApi.deletePhoto(photoId)
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === warehouseId
            ? { ...w, photos: w.photos.filter((p) => p.id !== photoId) }
            : w
        ),
        currentPhotoId: state.currentPhotoId === photoId ? null : state.currentPhotoId,
        loading: false,
      }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete photo'
      set({ error: message, loading: false })
      return false
    }
  },

  // Object CRUD
  addObject: async (warehouseId, photoId, name, memo, clippedImageDataUrl, mask, clickPoint) => {
    set({ loading: true, error: null })
    try {
      // マスクをバックエンド形式に変換
      const maskType = mask.type
      const maskData = mask.type === 'polygon'
        ? { points: mask.points }
        : { x: mask.x, y: mask.y, width: mask.width, height: mask.height }

      const res = await objectsApi.createObject(photoId, {
        name,
        memo,
        clipped_image_data_url: clippedImageDataUrl,
        mask_type: maskType,
        mask_data: maskData,
        click_point: clickPoint,
      })
      const obj = toStorageObject(res)
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === warehouseId
            ? {
                ...w,
                photos: w.photos.map((p) =>
                  p.id === photoId ? { ...p, objects: [...p.objects, obj] } : p
                ),
              }
            : w
        ),
        loading: false,
      }))
      return obj.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create object'
      set({ error: message, loading: false })
      return null
    }
  },

  updateObject: async (warehouseId, photoId, objectId, updates) => {
    const state = get()
    const warehouse = state.warehouses.find((w) => w.id === warehouseId)
    const photo = warehouse?.photos.find((p) => p.id === photoId)
    const obj = photo?.objects.find((o) => o.id === objectId)
    if (!obj) return false

    set({ loading: true, error: null })
    try {
      const res = await objectsApi.updateObject(objectId, {
        ...updates,
        version: obj.version,
      })
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === warehouseId
            ? {
                ...w,
                photos: w.photos.map((p) =>
                  p.id === photoId
                    ? {
                        ...p,
                        objects: p.objects.map((o) =>
                          o.id === objectId
                            ? { ...o, ...updates, version: res.version, updatedAt: res.updated_at }
                            : o
                        ),
                      }
                    : p
                ),
              }
            : w
        ),
        loading: false,
      }))
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        set({
          versionConflict: { type: 'object', id: objectId, serverData: err.serverData },
          loading: false,
        })
        return false
      }
      const message = err instanceof Error ? err.message : 'Failed to update object'
      set({ error: message, loading: false })
      return false
    }
  },

  deleteObject: async (warehouseId, photoId, objectId) => {
    set({ loading: true, error: null })
    try {
      await objectsApi.deleteObject(objectId)
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === warehouseId
            ? {
                ...w,
                photos: w.photos.map((p) =>
                  p.id === photoId
                    ? { ...p, objects: p.objects.filter((o) => o.id !== objectId) }
                    : p
                ),
              }
            : w
        ),
        selectedObjectId: state.selectedObjectId === objectId ? null : state.selectedObjectId,
        loading: false,
      }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete object'
      set({ error: message, loading: false })
      return false
    }
  },

  // Navigation
  setCurrentWarehouse: (id) => {
    set({ currentWarehouseId: id })
    if (id) {
      get().loadPhotos(id)
    }
  },

  setCurrentPhoto: (id) => {
    set({ currentPhotoId: id })
    if (id) {
      get().loadObjects(id)
    }
  },

  nextPhoto: () => {
    const state = get()
    if (!state.currentWarehouseId || !state.currentPhotoId) return

    const warehouse = state.warehouses.find((w) => w.id === state.currentWarehouseId)
    if (!warehouse) return

    const currentIndex = warehouse.photos.findIndex((p) => p.id === state.currentPhotoId)
    if (currentIndex < 0 || currentIndex >= warehouse.photos.length - 1) return

    const nextPhotoId = warehouse.photos[currentIndex + 1].id
    set({ currentPhotoId: nextPhotoId })
    get().loadObjects(nextPhotoId)
  },

  prevPhoto: () => {
    const state = get()
    if (!state.currentWarehouseId || !state.currentPhotoId) return

    const warehouse = state.warehouses.find((w) => w.id === state.currentWarehouseId)
    if (!warehouse) return

    const currentIndex = warehouse.photos.findIndex((p) => p.id === state.currentPhotoId)
    if (currentIndex <= 0) return

    const prevPhotoId = warehouse.photos[currentIndex - 1].id
    set({ currentPhotoId: prevPhotoId })
    get().loadObjects(prevPhotoId)
  },

  // UI State
  setViewMode: (mode) => {
    set({ viewMode: mode })
  },

  setSelectedObjectId: (id) => {
    set({ selectedObjectId: id })
  },

  setInputMode: (mode) => {
    set({ inputMode: mode })
  },

  // Error handling
  clearError: () => {
    set({ error: null })
  },

  clearVersionConflict: () => {
    set({ versionConflict: null })
  },

  forceUpdate: async () => {
    // 楽観的ロック競合時に強制上書きするための処理
    // ConflictDialogから呼び出される
    const state = get()
    if (!state.versionConflict) return false

    // 最新データを再読み込みして競合を解消
    await get().loadWarehouses()
    set({ versionConflict: null })
    return true
  },
}))
