import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateId, getCurrentTimestamp, createWarehouse, createPhoto, createStorageObject } from './dataUtils'

describe('generateId', () => {
  it('UUID v4形式のIDを生成する', () => {
    const id = generateId()
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(id).toMatch(uuidRegex)
  })

  it('毎回異なるIDを生成する', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })
})

describe('getCurrentTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ISO 8601形式の日時を返す', () => {
    const mockDate = new Date('2025-01-06T12:34:56.789Z')
    vi.setSystemTime(mockDate)

    const timestamp = getCurrentTimestamp()
    expect(timestamp).toBe('2025-01-06T12:34:56.789Z')
  })

  it('現在時刻を返す', () => {
    const now = new Date('2025-06-15T09:00:00.000Z')
    vi.setSystemTime(now)

    const timestamp = getCurrentTimestamp()
    expect(timestamp).toBe('2025-06-15T09:00:00.000Z')
  })
})

describe('createWarehouse', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-06T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('新しい倉庫オブジェクトを作成する', () => {
    const warehouse = createWarehouse('第一倉庫', '倉庫のメモ')

    expect(warehouse.name).toBe('第一倉庫')
    expect(warehouse.memo).toBe('倉庫のメモ')
    expect(warehouse.photos).toEqual([])
    expect(warehouse.id).toBeDefined()
    expect(warehouse.createdAt).toBe('2025-01-06T12:00:00.000Z')
    expect(warehouse.updatedAt).toBe('2025-01-06T12:00:00.000Z')
  })

  it('メモがない場合は空文字', () => {
    const warehouse = createWarehouse('倉庫')

    expect(warehouse.memo).toBe('')
  })
})

describe('createPhoto', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-06T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('新しい写真オブジェクトを作成する', () => {
    const photo = createPhoto('棚上段', 'data:image/png;base64,xxx', 1920, 1080)

    expect(photo.name).toBe('棚上段')
    expect(photo.imageDataUrl).toBe('data:image/png;base64,xxx')
    expect(photo.width).toBe(1920)
    expect(photo.height).toBe(1080)
    expect(photo.objects).toEqual([])
    expect(photo.id).toBeDefined()
    expect(photo.createdAt).toBe('2025-01-06T12:00:00.000Z')
    expect(photo.updatedAt).toBe('2025-01-06T12:00:00.000Z')
  })
})

describe('createStorageObject', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-06T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('新しいオブジェクトを作成する（矩形マスク）', () => {
    const obj = createStorageObject(
      'ハンマー',
      '立てて保管',
      'data:image/png;base64,clip',
      { type: 'rect', x: 10, y: 20, width: 100, height: 50 },
      { x: 50, y: 40 }
    )

    expect(obj.name).toBe('ハンマー')
    expect(obj.memo).toBe('立てて保管')
    expect(obj.clippedImageDataUrl).toBe('data:image/png;base64,clip')
    expect(obj.mask).toEqual({ type: 'rect', x: 10, y: 20, width: 100, height: 50 })
    expect(obj.clickPoint).toEqual({ x: 50, y: 40 })
    expect(obj.id).toBeDefined()
    expect(obj.createdAt).toBe('2025-01-06T12:00:00.000Z')
    expect(obj.updatedAt).toBe('2025-01-06T12:00:00.000Z')
  })

  it('新しいオブジェクトを作成する（ポリゴンマスク）', () => {
    const polygonMask = {
      type: 'polygon' as const,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
    }

    const obj = createStorageObject('ドリル', '', 'data:image/png;base64,xxx', polygonMask, { x: 50, y: 50 })

    expect(obj.mask).toEqual(polygonMask)
  })
})
