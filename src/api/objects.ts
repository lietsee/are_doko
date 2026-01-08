/**
 * オブジェクトAPI
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type { Position } from '../types/storage'

export interface ObjectResponse {
  id: string
  photo_id: string
  name: string
  memo: string
  clipped_image_url: string
  mask_type: 'polygon' | 'rect'
  mask_data: unknown
  click_point: Position
  display_order: number
  created_at: string
  updated_at: string
  version: number
}

export interface ObjectCreateRequest {
  name: string
  memo: string
  clipped_image_data_url: string
  mask_type: 'polygon' | 'rect'
  mask_data: Record<string, unknown>
  click_point: Position
}

export interface ObjectUpdateRequest {
  name?: string
  memo?: string
  version: number
}

export async function fetchObjects(photoId: string): Promise<ObjectResponse[]> {
  return apiGet<ObjectResponse[]>(`/api/photos/${photoId}/objects`)
}

export async function createObject(photoId: string, data: ObjectCreateRequest): Promise<ObjectResponse> {
  return apiPost<ObjectResponse>(`/api/photos/${photoId}/objects`, data)
}

export async function updateObject(id: string, data: ObjectUpdateRequest): Promise<ObjectResponse> {
  return apiPut<ObjectResponse>(`/api/objects/${id}`, data)
}

export async function deleteObject(id: string): Promise<void> {
  return apiDelete(`/api/objects/${id}`)
}
