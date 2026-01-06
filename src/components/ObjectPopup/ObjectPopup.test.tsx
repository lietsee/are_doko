import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ObjectPopup } from './ObjectPopup'
import type { StorageObject } from '../../types/storage'

describe('ObjectPopup', () => {
  const mockObject: StorageObject = {
    id: 'obj-1',
    name: 'ハンマー',
    memo: '棚の上段に立てて保管',
    clippedImageDataUrl: 'data:image/png;base64,testimage',
    mask: { type: 'rect', x: 10, y: 20, width: 50, height: 30 },
    clickPoint: { x: 35, y: 35 },
    createdAt: '2025-01-06T12:00:00.000Z',
    updatedAt: '2025-01-06T12:00:00.000Z',
  }

  it('オブジェクト名を表示する', () => {
    render(
      <ObjectPopup
        object={mockObject}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('ハンマー')).toBeInTheDocument()
  })

  it('メモを表示する', () => {
    render(
      <ObjectPopup
        object={mockObject}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('棚の上段に立てて保管')).toBeInTheDocument()
  })

  it('クリップ画像を表示する', () => {
    render(
      <ObjectPopup
        object={mockObject}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'data:image/png;base64,testimage')
    expect(img).toHaveAttribute('alt', 'ハンマー')
  })

  it('編集ボタンをクリックするとonEditが呼ばれる', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <ObjectPopup
        object={mockObject}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: '編集' }))

    expect(onEdit).toHaveBeenCalledWith(mockObject)
  })

  it('削除ボタンをクリックするとonDeleteが呼ばれる', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <ObjectPopup
        object={mockObject}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onClose={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: '削除' }))

    expect(onDelete).toHaveBeenCalledWith(mockObject)
  })

  it('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <ObjectPopup
        object={mockObject}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={onClose}
      />
    )

    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('メモが空の場合は「メモなし」を表示する', () => {
    const objectWithoutMemo: StorageObject = {
      ...mockObject,
      memo: '',
    }
    render(
      <ObjectPopup
        object={objectWithoutMemo}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('メモなし')).toBeInTheDocument()
  })
})
