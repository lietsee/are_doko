import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportDialog } from './ImportDialog'

describe('ImportDialog', () => {
  it('タイトルを表示する', () => {
    render(
      <ImportDialog
        isOpen={true}
        onOverwrite={vi.fn()}
        onMerge={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('データのインポート')).toBeInTheDocument()
  })

  it('上書きボタンをクリックするとonOverwriteが呼ばれる', async () => {
    const user = userEvent.setup()
    const onOverwrite = vi.fn()
    render(
      <ImportDialog
        isOpen={true}
        onOverwrite={onOverwrite}
        onMerge={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: '上書き' }))

    expect(onOverwrite).toHaveBeenCalled()
  })

  it('マージボタンをクリックするとonMergeが呼ばれる', async () => {
    const user = userEvent.setup()
    const onMerge = vi.fn()
    render(
      <ImportDialog
        isOpen={true}
        onOverwrite={vi.fn()}
        onMerge={onMerge}
        onCancel={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'マージ' }))

    expect(onMerge).toHaveBeenCalled()
  })

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ImportDialog
        isOpen={true}
        onOverwrite={vi.fn()}
        onMerge={vi.fn()}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('isOpen=falseの場合は何も表示しない', () => {
    render(
      <ImportDialog
        isOpen={false}
        onOverwrite={vi.fn()}
        onMerge={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByText('データのインポート')).not.toBeInTheDocument()
  })

  it('各モードの説明を表示する', () => {
    render(
      <ImportDialog
        isOpen={true}
        onOverwrite={vi.fn()}
        onMerge={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/既存データを削除/)).toBeInTheDocument()
    expect(screen.getByText(/既存データに追加/)).toBeInTheDocument()
  })
})
