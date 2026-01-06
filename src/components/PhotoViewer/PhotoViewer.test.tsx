import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoViewer } from './PhotoViewer'
import type { Photo, StorageObject } from '../../types/storage'

describe('PhotoViewer', () => {
  const mockObjects: StorageObject[] = [
    {
      id: 'o1',
      name: 'ハンマー',
      memo: '棚上段',
      clippedImageDataUrl: 'data:image/png;base64,clip1',
      mask: { type: 'rect', x: 100, y: 100, width: 50, height: 50 },
      clickPoint: { x: 125, y: 125 },
      createdAt: '2025-01-06T12:00:00.000Z',
      updatedAt: '2025-01-06T12:00:00.000Z',
    },
    {
      id: 'o2',
      name: 'ドライバー',
      memo: '棚下段',
      clippedImageDataUrl: 'data:image/png;base64,clip2',
      mask: { type: 'rect', x: 200, y: 200, width: 60, height: 40 },
      clickPoint: { x: 230, y: 220 },
      createdAt: '2025-01-06T12:00:00.000Z',
      updatedAt: '2025-01-06T12:00:00.000Z',
    },
  ]

  const mockPhoto: Photo = {
    id: 'p1',
    name: '棚上段',
    imageDataUrl: 'data:image/png;base64,photo',
    width: 800,
    height: 600,
    objects: mockObjects,
    createdAt: '2025-01-06T12:00:00.000Z',
    updatedAt: '2025-01-06T12:00:00.000Z',
  }

  it('写真を表示する', () => {
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        hasPrev={false}
        hasNext={false}
      />
    )

    const img = screen.getByRole('img', { name: '棚上段' })
    expect(img).toHaveAttribute('src', 'data:image/png;base64,photo')
  })

  it('オブジェクトオーバーレイを表示する', () => {
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        hasPrev={false}
        hasNext={false}
      />
    )

    // オーバーレイは data-testid で検出
    expect(screen.getByTestId('overlay-o1')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-o2')).toBeInTheDocument()
  })

  it('オーバーレイをクリックするとonObjectClickが呼ばれる', async () => {
    const user = userEvent.setup()
    const onObjectClick = vi.fn()
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={onObjectClick}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        hasPrev={false}
        hasNext={false}
      />
    )

    await user.click(screen.getByTestId('overlay-o1'))

    expect(onObjectClick).toHaveBeenCalledWith(mockObjects[0])
  })

  it('< ボタンをクリックするとonPrevが呼ばれる', async () => {
    const user = userEvent.setup()
    const onPrev = vi.fn()
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={vi.fn()}
        onPrev={onPrev}
        onNext={vi.fn()}
        hasPrev={true}
        hasNext={false}
      />
    )

    await user.click(screen.getByRole('button', { name: '前へ' }))

    expect(onPrev).toHaveBeenCalled()
  })

  it('> ボタンをクリックするとonNextが呼ばれる', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={vi.fn()}
        onPrev={vi.fn()}
        onNext={onNext}
        hasPrev={false}
        hasNext={true}
      />
    )

    await user.click(screen.getByRole('button', { name: '次へ' }))

    expect(onNext).toHaveBeenCalled()
  })

  it('hasPrev=falseの場合、< ボタンが無効', () => {
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        hasPrev={false}
        hasNext={true}
      />
    )

    expect(screen.getByRole('button', { name: '前へ' })).toBeDisabled()
  })

  it('hasNext=falseの場合、> ボタンが無効', () => {
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        hasPrev={true}
        hasNext={false}
      />
    )

    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled()
  })

  it('写真名を表示する', () => {
    render(
      <PhotoViewer
        photo={mockPhoto}
        onObjectClick={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        hasPrev={false}
        hasNext={false}
      />
    )

    expect(screen.getByText('棚上段')).toBeInTheDocument()
  })

  it('選択中のオブジェクトがハイライトされる', () => {
    render(
      <PhotoViewer
        photo={mockPhoto}
        selectedObjectId="o1"
        onObjectClick={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        hasPrev={false}
        hasNext={false}
      />
    )

    const overlay = screen.getByTestId('overlay-o1')
    expect(overlay).toHaveClass('ring-4')
  })
})
