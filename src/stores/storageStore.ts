import { create } from 'zustand'
import type { Warehouse, Photo, StorageObject, AppData, ViewMode, InputMode, ObjectMask, Position } from '../types/storage'
import { generateId, getCurrentTimestamp } from '../utils/dataUtils'

interface StorageState {
  // Data
  warehouses: Warehouse[]
  version: string
  createdAt: string | null
  updatedAt: string | null

  // UI State
  currentWarehouseId: string | null
  currentPhotoId: string | null
  selectedObjectId: string | null
  viewMode: ViewMode
  inputMode: InputMode
}

interface StorageActions {
  // Data initialization
  setInitialData: (data: AppData) => void
  getAppData: () => AppData

  // Warehouse CRUD
  addWarehouse: (name: string, memo?: string) => string
  updateWarehouse: (id: string, updates: Partial<Pick<Warehouse, 'name' | 'memo'>>) => void
  deleteWarehouse: (id: string) => void

  // Photo CRUD
  addPhoto: (warehouseId: string, name: string, imageDataUrl: string, width: number, height: number) => string
  updatePhoto: (warehouseId: string, photoId: string, updates: Partial<Pick<Photo, 'name'>>) => void
  deletePhoto: (warehouseId: string, photoId: string) => void

  // Object CRUD
  addObject: (
    warehouseId: string,
    photoId: string,
    name: string,
    memo: string,
    clippedImageDataUrl: string,
    mask: ObjectMask,
    clickPoint: Position
  ) => string
  updateObject: (
    warehouseId: string,
    photoId: string,
    objectId: string,
    updates: Partial<Pick<StorageObject, 'name' | 'memo'>>
  ) => void
  deleteObject: (warehouseId: string, photoId: string, objectId: string) => void

  // Navigation
  setCurrentWarehouse: (id: string | null) => void
  setCurrentPhoto: (id: string | null) => void
  nextPhoto: () => void
  prevPhoto: () => void

  // UI State
  setViewMode: (mode: ViewMode) => void
  setSelectedObjectId: (id: string | null) => void
  setInputMode: (mode: InputMode) => void
}

export const useStorageStore = create<StorageState & StorageActions>((set, get) => ({
  // Initial state
  warehouses: [],
  version: '1.0.0',
  createdAt: null,
  updatedAt: null,
  currentWarehouseId: null,
  currentPhotoId: null,
  selectedObjectId: null,
  viewMode: 'view',
  inputMode: 'rect',

  // Data initialization
  setInitialData: (data) => {
    set({
      warehouses: data.warehouses,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  },

  getAppData: () => {
    const state = get()
    return {
      version: state.version,
      warehouses: state.warehouses,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    }
  },

  // Warehouse CRUD
  addWarehouse: (name, memo = '') => {
    const id = generateId()
    const now = getCurrentTimestamp()
    const newWarehouse: Warehouse = {
      id,
      name,
      memo,
      photos: [],
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      warehouses: [...state.warehouses, newWarehouse],
      updatedAt: now,
    }))
    return id
  },

  updateWarehouse: (id, updates) => {
    const now = getCurrentTimestamp()
    set((state) => ({
      warehouses: state.warehouses.map((w) =>
        w.id === id ? { ...w, ...updates, updatedAt: now } : w
      ),
      updatedAt: now,
    }))
  },

  deleteWarehouse: (id) => {
    const now = getCurrentTimestamp()
    set((state) => ({
      warehouses: state.warehouses.filter((w) => w.id !== id),
      currentWarehouseId: state.currentWarehouseId === id ? null : state.currentWarehouseId,
      currentPhotoId:
        state.warehouses.find((w) => w.id === id)?.photos.some((p) => p.id === state.currentPhotoId)
          ? null
          : state.currentPhotoId,
      updatedAt: now,
    }))
  },

  // Photo CRUD
  addPhoto: (warehouseId, name, imageDataUrl, width, height) => {
    const id = generateId()
    const now = getCurrentTimestamp()
    const newPhoto: Photo = {
      id,
      name,
      imageDataUrl,
      width,
      height,
      objects: [],
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      warehouses: state.warehouses.map((w) =>
        w.id === warehouseId
          ? { ...w, photos: [...w.photos, newPhoto], updatedAt: now }
          : w
      ),
      updatedAt: now,
    }))
    return id
  },

  updatePhoto: (warehouseId, photoId, updates) => {
    const now = getCurrentTimestamp()
    set((state) => ({
      warehouses: state.warehouses.map((w) =>
        w.id === warehouseId
          ? {
              ...w,
              photos: w.photos.map((p) =>
                p.id === photoId ? { ...p, ...updates, updatedAt: now } : p
              ),
              updatedAt: now,
            }
          : w
      ),
      updatedAt: now,
    }))
  },

  deletePhoto: (warehouseId, photoId) => {
    const now = getCurrentTimestamp()
    set((state) => ({
      warehouses: state.warehouses.map((w) =>
        w.id === warehouseId
          ? { ...w, photos: w.photos.filter((p) => p.id !== photoId), updatedAt: now }
          : w
      ),
      currentPhotoId: state.currentPhotoId === photoId ? null : state.currentPhotoId,
      updatedAt: now,
    }))
  },

  // Object CRUD
  addObject: (warehouseId, photoId, name, memo, clippedImageDataUrl, mask, clickPoint) => {
    const id = generateId()
    const now = getCurrentTimestamp()
    const newObject: StorageObject = {
      id,
      name,
      memo,
      clippedImageDataUrl,
      mask,
      clickPoint,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      warehouses: state.warehouses.map((w) =>
        w.id === warehouseId
          ? {
              ...w,
              photos: w.photos.map((p) =>
                p.id === photoId
                  ? { ...p, objects: [...p.objects, newObject], updatedAt: now }
                  : p
              ),
              updatedAt: now,
            }
          : w
      ),
      updatedAt: now,
    }))
    return id
  },

  updateObject: (warehouseId, photoId, objectId, updates) => {
    const now = getCurrentTimestamp()
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
                        o.id === objectId ? { ...o, ...updates, updatedAt: now } : o
                      ),
                      updatedAt: now,
                    }
                  : p
              ),
              updatedAt: now,
            }
          : w
      ),
      updatedAt: now,
    }))
  },

  deleteObject: (warehouseId, photoId, objectId) => {
    const now = getCurrentTimestamp()
    set((state) => ({
      warehouses: state.warehouses.map((w) =>
        w.id === warehouseId
          ? {
              ...w,
              photos: w.photos.map((p) =>
                p.id === photoId
                  ? { ...p, objects: p.objects.filter((o) => o.id !== objectId), updatedAt: now }
                  : p
              ),
              updatedAt: now,
            }
          : w
      ),
      selectedObjectId: state.selectedObjectId === objectId ? null : state.selectedObjectId,
      updatedAt: now,
    }))
  },

  // Navigation
  setCurrentWarehouse: (id) => {
    set({ currentWarehouseId: id })
  },

  setCurrentPhoto: (id) => {
    set({ currentPhotoId: id })
  },

  nextPhoto: () => {
    const state = get()
    if (!state.currentWarehouseId || !state.currentPhotoId) return

    const warehouse = state.warehouses.find((w) => w.id === state.currentWarehouseId)
    if (!warehouse) return

    const currentIndex = warehouse.photos.findIndex((p) => p.id === state.currentPhotoId)
    if (currentIndex < 0 || currentIndex >= warehouse.photos.length - 1) return

    set({ currentPhotoId: warehouse.photos[currentIndex + 1].id })
  },

  prevPhoto: () => {
    const state = get()
    if (!state.currentWarehouseId || !state.currentPhotoId) return

    const warehouse = state.warehouses.find((w) => w.id === state.currentWarehouseId)
    if (!warehouse) return

    const currentIndex = warehouse.photos.findIndex((p) => p.id === state.currentPhotoId)
    if (currentIndex <= 0) return

    set({ currentPhotoId: warehouse.photos[currentIndex - 1].id })
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
}))
