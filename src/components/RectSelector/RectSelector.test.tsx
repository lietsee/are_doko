import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RectSelector } from './RectSelector'

describe('RectSelector', () => {
  const mockImageDataUrl = 'data:image/png;base64,test'

  it('画像を表示する', () => {
    render(
      <RectSelector
        imageDataUrl={mockImageDataUrl}
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', mockImageDataUrl)
  })

  it('ドラッグで矩形を描画できる', () => {
    render(
      <RectSelector
        imageDataUrl={mockImageDataUrl}
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const canvas = screen.getByTestId('rect-selector-canvas')

    // マウスダウン
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })

    // ドラッグ中に矩形が表示される
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })

    // 選択中の矩形が表示されていることを確認
    const selectionRect = screen.getByTestId('selection-rect')
    expect(selectionRect).toBeInTheDocument()
  })

  it('ドラッグ終了時にonSelectが呼ばれる', () => {
    const onSelect = vi.fn()
    render(
      <RectSelector
        imageDataUrl={mockImageDataUrl}
        imageWidth={800}
        imageHeight={600}
        onSelect={onSelect}
        onCancel={vi.fn()}
      />
    )

    const canvas = screen.getByTestId('rect-selector-canvas')

    // getBoundingClientRect をモック
    const mockRect = { left: 0, top: 0, width: 800, height: 600 }
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect)

    // マウスダウン
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })

    // ドラッグ
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })

    // マウスアップ
    fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 })

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      })
    )
  })

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
    const onCancel = vi.fn()
    render(
      <RectSelector
        imageDataUrl={mockImageDataUrl}
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('小さすぎる矩形（5px未満）は無視する', () => {
    const onSelect = vi.fn()
    render(
      <RectSelector
        imageDataUrl={mockImageDataUrl}
        imageWidth={800}
        imageHeight={600}
        onSelect={onSelect}
        onCancel={vi.fn()}
      />
    )

    const canvas = screen.getByTestId('rect-selector-canvas')

    // getBoundingClientRect をモック
    const mockRect = { left: 0, top: 0, width: 800, height: 600 }
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect)

    // 小さすぎるドラッグ
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 102, clientY: 102 })
    fireEvent.mouseUp(canvas, { clientX: 102, clientY: 102 })

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('説明文を表示する', () => {
    render(
      <RectSelector
        imageDataUrl={mockImageDataUrl}
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/ドラッグ/)).toBeInTheDocument()
  })
})
