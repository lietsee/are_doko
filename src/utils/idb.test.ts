import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { saveAppData, loadAppData, clearAppData } from './idb'
import type { AppData } from '../types/storage'

describe('IndexedDB操作', () => {
  const testData: AppData = {
    version: '1.0.0',
    warehouses: [
      {
        id: 'w1',
        name: '倉庫1',
        memo: 'メモ',
        photos: [
          {
            id: 'p1',
            name: '写真1',
            imageDataUrl: 'data:image/png;base64,xxx',
            width: 100,
            height: 100,
            objects: [
              {
                id: 'o1',
                name: 'ハンマー',
                memo: '立てて保管',
                clippedImageDataUrl: 'data:image/png;base64,clip',
                mask: { type: 'rect', x: 10, y: 20, width: 50, height: 30 },
                clickPoint: { x: 25, y: 35 },
                createdAt: '2025-01-06T12:00:00.000Z',
                updatedAt: '2025-01-06T12:00:00.000Z',
              },
            ],
            createdAt: '2025-01-06T12:00:00.000Z',
            updatedAt: '2025-01-06T12:00:00.000Z',
          },
        ],
        createdAt: '2025-01-06T12:00:00.000Z',
        updatedAt: '2025-01-06T12:00:00.000Z',
      },
    ],
    createdAt: '2025-01-06T12:00:00.000Z',
    updatedAt: '2025-01-06T12:00:00.000Z',
  }

  beforeEach(async () => {
    // Clear database before each test
    await clearAppData()
  })

  it('saveAppData: データを保存できる', async () => {
    await saveAppData(testData)

    // Verify by loading
    const loaded = await loadAppData()
    expect(loaded).not.toBeNull()
    expect(loaded?.version).toBe('1.0.0')
  })

  it('loadAppData: データを読み込める', async () => {
    await saveAppData(testData)

    const loaded = await loadAppData()

    expect(loaded).not.toBeNull()
    expect(loaded?.warehouses).toHaveLength(1)
    expect(loaded?.warehouses[0].name).toBe('倉庫1')
    expect(loaded?.warehouses[0].photos).toHaveLength(1)
    expect(loaded?.warehouses[0].photos[0].objects).toHaveLength(1)
    expect(loaded?.warehouses[0].photos[0].objects[0].name).toBe('ハンマー')
  })

  it('loadAppData: データがない場合はnullを返す', async () => {
    const loaded = await loadAppData()

    expect(loaded).toBeNull()
  })

  it('clearAppData: データを削除できる', async () => {
    await saveAppData(testData)

    // Verify data exists
    const beforeClear = await loadAppData()
    expect(beforeClear).not.toBeNull()

    // Clear
    await clearAppData()

    // Verify data is gone
    const afterClear = await loadAppData()
    expect(afterClear).toBeNull()
  })

  it('saveAppData: 既存データを上書きできる', async () => {
    await saveAppData(testData)

    const updatedData: AppData = {
      ...testData,
      warehouses: [
        ...testData.warehouses,
        {
          id: 'w2',
          name: '倉庫2',
          memo: '',
          photos: [],
          createdAt: '2025-01-06T13:00:00.000Z',
          updatedAt: '2025-01-06T13:00:00.000Z',
        },
      ],
    }

    await saveAppData(updatedData)

    const loaded = await loadAppData()
    expect(loaded?.warehouses).toHaveLength(2)
    expect(loaded?.warehouses[1].name).toBe('倉庫2')
  })
})
