import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ObjectForm } from './ObjectForm'

describe('ObjectForm', () => {
  const mockPreviewImage = 'data:image/png;base64,preview'

  it('名前入力フィールドを表示する', () => {
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByLabelText('名前')).toBeInTheDocument()
  })

  it('メモ入力フィールドを表示する', () => {
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByLabelText('メモ')).toBeInTheDocument()
  })

  it('プレビュー画像を表示する', () => {
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', mockPreviewImage)
  })

  it('保存ボタンをクリックするとonSaveが呼ばれる', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    )

    await user.type(screen.getByLabelText('名前'), 'ハンマー')
    await user.type(screen.getByLabelText('メモ'), '棚の上段')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(onSave).toHaveBeenCalledWith('ハンマー', '棚の上段')
  })

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        onSave={vi.fn()}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('名前が空の場合は保存ボタンが無効', () => {
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('名前を入力すると保存ボタンが有効になる', async () => {
    const user = userEvent.setup()
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    await user.type(screen.getByLabelText('名前'), 'ドライバー')

    expect(screen.getByRole('button', { name: '保存' })).toBeEnabled()
  })

  it('初期値を設定できる（編集モード）', () => {
    render(
      <ObjectForm
        previewImageDataUrl={mockPreviewImage}
        initialName="既存名"
        initialMemo="既存メモ"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByLabelText('名前')).toHaveValue('既存名')
    expect(screen.getByLabelText('メモ')).toHaveValue('既存メモ')
  })
})
