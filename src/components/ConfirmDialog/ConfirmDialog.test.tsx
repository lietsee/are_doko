import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('タイトルを表示する', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="削除確認"
        message="本当に削除しますか？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('削除確認')).toBeInTheDocument()
  })

  it('メッセージを表示する', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="削除確認"
        message="本当に削除しますか？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument()
  })

  it('確認ボタンをクリックするとonConfirmが呼ばれる', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        isOpen={true}
        title="削除確認"
        message="本当に削除しますか？"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: '削除' }))

    expect(onConfirm).toHaveBeenCalled()
  })

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen={true}
        title="削除確認"
        message="本当に削除しますか？"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('isOpen=falseの場合は何も表示しない', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="削除確認"
        message="本当に削除しますか？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByText('削除確認')).not.toBeInTheDocument()
  })

  it('カスタム確認ボタンテキストを表示できる', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="確認"
        message="実行しますか？"
        confirmText="実行"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '実行' })).toBeInTheDocument()
  })
})
