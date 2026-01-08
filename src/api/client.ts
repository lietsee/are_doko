/**
 * APIクライアント
 */

import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

interface FetchOptions extends RequestInit {
  body?: BodyInit | null
}

export class ApiError extends Error {
  status: number
  code?: string
  serverData?: unknown

  constructor(
    message: string,
    status: number,
    code?: string,
    serverData?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.serverData = serverData
  }
}

/**
 * 認証トークン付きfetch
 */
async function fetchWithAuth(path: string, options: FetchOptions = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  return response
}

/**
 * GET
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetchWithAuth(path)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.detail || 'Request failed',
      response.status,
      error.code,
      error.server_data
    )
  }

  return response.json()
}

/**
 * POST
 */
export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const response = await fetchWithAuth(path, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.detail || 'Request failed',
      response.status,
      error.code,
      error.server_data
    )
  }

  return response.json()
}

/**
 * PUT
 */
export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  const response = await fetchWithAuth(path, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.detail || 'Request failed',
      response.status,
      error.code,
      error.server_data
    )
  }

  return response.json()
}

/**
 * DELETE
 */
export async function apiDelete(path: string): Promise<void> {
  const response = await fetchWithAuth(path, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.detail || 'Request failed',
      response.status,
      error.code,
      error.server_data
    )
  }
}
