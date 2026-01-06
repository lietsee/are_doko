import { describe, it, expect } from 'vitest'
import { exportData, importData, validateAppData } from './exportImport'
import type { AppData } from '../types/storage'

describe('exportImport', () => {
  const validAppData: AppData = {
    version: '1.0.0',
    warehouses: [
      {
        id: 'w1',
        name: '第一倉庫',
        memo: 'テスト用',
        photos: [
          {
            id: 'p1',
            name: '棚上段',
            imageDataUrl: 'data:image/png;base64,xxx',
            width: 800,
            height: 600,
            objects: [
              {
                id: 'o1',
                name: 'ハンマー',
                memo: '棚の上',
                clippedImageDataUrl: 'data:image/png;base64,clip',
                mask: { type: 'rect', x: 100, y: 100, width: 50, height: 50 },
                clickPoint: { x: 125, y: 125 },
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

  describe('validateAppData', () => {
    it('有効なデータの場合trueを返す', () => {
      expect(validateAppData(validAppData)).toBe(true)
    })

    it('versionがない場合falseを返す', () => {
      const invalid = { ...validAppData, version: undefined }
      expect(validateAppData(invalid as unknown as AppData)).toBe(false)
    })

    it('warehousesがない場合falseを返す', () => {
      const invalid = { ...validAppData, warehouses: undefined }
      expect(validateAppData(invalid as unknown as AppData)).toBe(false)
    })

    it('warehousesが配列でない場合falseを返す', () => {
      const invalid = { ...validAppData, warehouses: 'not array' }
      expect(validateAppData(invalid as unknown as AppData)).toBe(false)
    })
  })

  describe('exportData', () => {
    it('全データをJSON文字列で出力する', () => {
      const json = exportData(validAppData)
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe('1.0.0')
      expect(parsed.warehouses).toHaveLength(1)
      expect(parsed.warehouses[0].name).toBe('第一倉庫')
    })

    it('JSONは整形されている', () => {
      const json = exportData(validAppData)

      expect(json).toContain('\n')
      expect(json).toContain('  ')
    })
  })

  describe('importData', () => {
    it('JSONファイルを読み込める（上書きモード）', () => {
      const json = exportData(validAppData)
      const result = importData(json, 'overwrite')

      expect(result.success).toBe(true)
      expect(result.data?.warehouses).toHaveLength(1)
      expect(result.data?.warehouses[0].name).toBe('第一倉庫')
    })

    it('マージモード: IDを再生成して追加する', () => {
      const json = exportData(validAppData)
      const existingData: AppData = {
        version: '1.0.0',
        warehouses: [
          {
            id: 'existing-w1',
            name: '既存倉庫',
            memo: '',
            photos: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }

      const result = importData(json, 'merge', existingData)

      expect(result.success).toBe(true)
      expect(result.data?.warehouses).toHaveLength(2)
      // IDが再生成されている（元のIDと異なる）
      expect(result.data?.warehouses[1].id).not.toBe('w1')
    })

    it('不正なJSONはエラーを返す', () => {
      const result = importData('invalid json', 'overwrite')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('構造が不正な場合はエラーを返す', () => {
      const invalidJson = JSON.stringify({ foo: 'bar' })
      const result = importData(invalidJson, 'overwrite')

      expect(result.success).toBe(false)
      expect(result.error).toContain('無効')
    })
  })
})
