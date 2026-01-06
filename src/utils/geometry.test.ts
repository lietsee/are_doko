import { describe, it, expect } from 'vitest'
import type { Position, PolygonMask, RectMask, StorageObject } from '../types/storage'
import { isPointInPolygon, isPointInRect, isPointInMask, findObjectAtPoint } from './geometry'

describe('isPointInPolygon', () => {
  // 正方形ポリゴン: (0,0), (100,0), (100,100), (0,100)
  const squarePolygon: Position[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ]

  it('点がポリゴン内にある場合trueを返す', () => {
    expect(isPointInPolygon({ x: 50, y: 50 }, squarePolygon)).toBe(true)
    expect(isPointInPolygon({ x: 10, y: 10 }, squarePolygon)).toBe(true)
    expect(isPointInPolygon({ x: 90, y: 90 }, squarePolygon)).toBe(true)
  })

  it('点がポリゴン外にある場合falseを返す', () => {
    expect(isPointInPolygon({ x: -10, y: 50 }, squarePolygon)).toBe(false)
    expect(isPointInPolygon({ x: 150, y: 50 }, squarePolygon)).toBe(false)
    expect(isPointInPolygon({ x: 50, y: -10 }, squarePolygon)).toBe(false)
    expect(isPointInPolygon({ x: 50, y: 150 }, squarePolygon)).toBe(false)
  })

  it('三角形ポリゴンでも正しく判定する', () => {
    const triangle: Position[] = [
      { x: 50, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    expect(isPointInPolygon({ x: 50, y: 50 }, triangle)).toBe(true)
    expect(isPointInPolygon({ x: 10, y: 10 }, triangle)).toBe(false)
  })
})

describe('isPointInRect', () => {
  const rect: RectMask = {
    type: 'rect',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
  }

  it('点が矩形内にある場合trueを返す', () => {
    expect(isPointInRect({ x: 50, y: 40 }, rect)).toBe(true)
    expect(isPointInRect({ x: 10, y: 20 }, rect)).toBe(true) // 左上角
    expect(isPointInRect({ x: 110, y: 70 }, rect)).toBe(true) // 右下角
  })

  it('点が矩形外にある場合falseを返す', () => {
    expect(isPointInRect({ x: 5, y: 40 }, rect)).toBe(false) // 左外
    expect(isPointInRect({ x: 115, y: 40 }, rect)).toBe(false) // 右外
    expect(isPointInRect({ x: 50, y: 15 }, rect)).toBe(false) // 上外
    expect(isPointInRect({ x: 50, y: 75 }, rect)).toBe(false) // 下外
  })
})

describe('isPointInMask', () => {
  it('PolygonMaskで正しく判定する', () => {
    const polygonMask: PolygonMask = {
      type: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    }
    expect(isPointInMask({ x: 50, y: 50 }, polygonMask)).toBe(true)
    expect(isPointInMask({ x: 150, y: 50 }, polygonMask)).toBe(false)
  })

  it('RectMaskで正しく判定する', () => {
    const rectMask: RectMask = {
      type: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }
    expect(isPointInMask({ x: 50, y: 50 }, rectMask)).toBe(true)
    expect(isPointInMask({ x: 150, y: 50 }, rectMask)).toBe(false)
  })
})

describe('findObjectAtPoint', () => {
  const createMockObject = (id: string, mask: PolygonMask | RectMask): StorageObject => ({
    id,
    name: `Object ${id}`,
    memo: '',
    clippedImageDataUrl: '',
    mask,
    clickPoint: { x: 0, y: 0 },
    createdAt: '',
    updatedAt: '',
  })

  const object1 = createMockObject('1', {
    type: 'rect',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  })

  const object2 = createMockObject('2', {
    type: 'rect',
    x: 50,
    y: 50,
    width: 100,
    height: 100,
  })

  const object3 = createMockObject('3', {
    type: 'rect',
    x: 200,
    y: 200,
    width: 50,
    height: 50,
  })

  it('クリック点にあるオブジェクトを返す', () => {
    const objects = [object1, object3]
    const result = findObjectAtPoint({ x: 50, y: 50 }, objects)
    expect(result).toBe(object1)
  })

  it('複数重なる場合は配列の後ろを優先', () => {
    const objects = [object1, object2]
    // (75, 75) は object1 と object2 の両方に含まれる
    const result = findObjectAtPoint({ x: 75, y: 75 }, objects)
    expect(result).toBe(object2) // 後ろが優先
  })

  it('オブジェクトがない場合nullを返す', () => {
    const objects = [object1, object2]
    const result = findObjectAtPoint({ x: 300, y: 300 }, objects)
    expect(result).toBeNull()
  })

  it('空の配列の場合nullを返す', () => {
    const result = findObjectAtPoint({ x: 50, y: 50 }, [])
    expect(result).toBeNull()
  })
})
