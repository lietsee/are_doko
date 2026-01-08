/**
 * 写真API
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface PhotoResponse {
  id: string
  warehouse_id: string
  name: string
  image_url: string
  width: number
  height: number
  display_order: number
  created_at: string
  updated_at: string
  version: number
}

export interface PhotoCreateRequest {
  name: string
  image_data_url: string
  width: number
  height: number
}

export interface PhotoUpdateRequest {
  name?: string
  version: number
}

export async function fetchPhotos(warehouseId: string): Promise<PhotoResponse[]> {
  return apiGet<PhotoResponse[]>(`/api/warehouses/${warehouseId}/photos`)
}

export async function createPhoto(warehouseId: string, data: PhotoCreateRequest): Promise<PhotoResponse> {
  return apiPost<PhotoResponse>(`/api/warehouses/${warehouseId}/photos`, data)
}

export async function updatePhoto(id: string, data: PhotoUpdateRequest): Promise<PhotoResponse> {
  return apiPut<PhotoResponse>(`/api/photos/${id}`, data)
}

export async function deletePhoto(id: string): Promise<void> {
  return apiDelete(`/api/photos/${id}`)
}
