import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoDialog } from './PhotoDialog'

describe('PhotoDialog', () => {
  it('ダイアログタイトルを表示する', () => {
    render(
      <PhotoDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('写真を追加')).toBeInTheDocument()
  })

  it('ファイル選択ボタンを表示する', () => {
    render(
      <PhotoDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByLabelText('画像ファイル')).toBeInTheDocument()
  })

  it('写真名入力フィールドを表示する', () => {
    render(
      <PhotoDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByLabelText('写真名')).toBeInTheDocument()
  })

  it('キャンセルボタンをクリックするとonCloseが呼ばれる', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <PhotoDialog
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('画像が選択されていない場合は保存ボタンが無効', () => {
    render(
      <PhotoDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('isOpen=falseの場合は何も表示しない', () => {
    render(
      <PhotoDialog
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.queryByText('写真を追加')).not.toBeInTheDocument()
  })
})
