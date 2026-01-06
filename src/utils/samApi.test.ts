import { describe, it, expect, vi, beforeEach } from 'vitest'
import { polygonToBoundingBox, checkSamHealth, segment } from './samApi'

describe('polygonToBoundingBox', () => {
  it('ポリゴンからバウンディングボックスを計算する', () => {
    const polygon = [
      { x: 100, y: 150 },
      { x: 200, y: 150 },
      { x: 200, y: 250 },
      { x: 100, y: 250 },
    ]

    const result = polygonToBoundingBox(polygon)

    expect(result).toEqual({
      x: 100,
      y: 150,
      width: 100,
      height: 100,
    })
  })

  it('空のポリゴンの場合はゼロを返す', () => {
    const result = polygonToBoundingBox([])

    expect(result).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })

  it('不規則なポリゴンでも正しく計算する', () => {
    const polygon = [
      { x: 50, y: 100 },
      { x: 150, y: 80 },
      { x: 200, y: 150 },
      { x: 180, y: 220 },
      { x: 70, y: 200 },
    ]

    const result = polygonToBoundingBox(polygon)

    expect(result).toEqual({
      x: 50,
      y: 80,
      width: 150,
      height: 140,
    })
  })
})

describe('checkSamHealth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('サーバーが正常な場合はtrueを返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
    } as Response)

    const result = await checkSamHealth()

    expect(result).toBe(true)
  })

  it('サーバーがエラーの場合はfalseを返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
    } as Response)

    const result = await checkSamHealth()

    expect(result).toBe(false)
  })

  it('接続できない場合はfalseを返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const result = await checkSamHealth()

    expect(result).toBe(false)
  })
})

describe('segment', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('正常なレスポンスを返す', async () => {
    const mockResponse = {
      polygon: [
        { x: 100, y: 150 },
        { x: 200, y: 150 },
        { x: 200, y: 250 },
        { x: 100, y: 250 },
      ],
      bounding_box: { x: 100, y: 150, width: 100, height: 100 },
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await segment('data:image/png;base64,xxx', 150, 200)

    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/segment',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('エラーレスポンスの場合は例外を投げる', async () => {
    const errorResponse = {
      detail: {
        error: 'オブジェクトが検出できませんでした',
        code: 'NO_OBJECT_FOUND',
      },
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(errorResponse),
    } as Response)

    await expect(segment('data:image/png;base64,xxx', 150, 200)).rejects.toEqual(
      errorResponse.detail
    )
  })
})
