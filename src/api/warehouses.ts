/**
 * 倉庫API
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface WarehouseResponse {
  id: string
  name: string
  memo: string
  created_at: string
  updated_at: string
  version: number
}

export interface WarehouseCreateRequest {
  name: string
  memo?: string
}

export interface WarehouseUpdateRequest {
  name?: string
  memo?: string
  version: number
}

export async function fetchWarehouses(): Promise<WarehouseResponse[]> {
  return apiGet<WarehouseResponse[]>('/api/warehouses')
}

export async function createWarehouse(data: WarehouseCreateRequest): Promise<WarehouseResponse> {
  return apiPost<WarehouseResponse>('/api/warehouses', data)
}

export async function updateWarehouse(id: string, data: WarehouseUpdateRequest): Promise<WarehouseResponse> {
  return apiPut<WarehouseResponse>(`/api/warehouses/${id}`, data)
}

export async function deleteWarehouse(id: string): Promise<void> {
  return apiDelete(`/api/warehouses/${id}`)
}
