import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WarehouseDialog } from './WarehouseDialog'

describe('WarehouseDialog', () => {
  it('ダイアログタイトルを表示する（新規作成）', () => {
    render(
      <WarehouseDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('倉庫を追加')).toBeInTheDocument()
  })

  it('ダイアログタイトルを表示する（編集）', () => {
    render(
      <WarehouseDialog
        isOpen={true}
        initialName="既存倉庫"
        initialMemo="メモ"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('倉庫を編集')).toBeInTheDocument()
  })

  it('名前入力フィールドを表示する', () => {
    render(
      <WarehouseDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByLabelText('倉庫名')).toBeInTheDocument()
  })

  it('メモ入力フィールドを表示する', () => {
    render(
      <WarehouseDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByLabelText('メモ')).toBeInTheDocument()
  })

  it('保存ボタンをクリックするとonSaveが呼ばれる', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <WarehouseDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    )

    await user.type(screen.getByLabelText('倉庫名'), '新しい倉庫')
    await user.type(screen.getByLabelText('メモ'), '工具類を保管')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(onSave).toHaveBeenCalledWith('新しい倉庫', '工具類を保管')
  })

  it('キャンセルボタンをクリックするとonCloseが呼ばれる', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <WarehouseDialog
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('名前が空の場合は保存ボタンが無効', () => {
    render(
      <WarehouseDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('isOpen=falseの場合は何も表示しない', () => {
    render(
      <WarehouseDialog
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.queryByText('倉庫を追加')).not.toBeInTheDocument()
  })

  it('初期値が設定されている場合、入力欄に表示する', () => {
    render(
      <WarehouseDialog
        isOpen={true}
        initialName="既存倉庫"
        initialMemo="既存メモ"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByLabelText('倉庫名')).toHaveValue('既存倉庫')
    expect(screen.getByLabelText('メモ')).toHaveValue('既存メモ')
  })
})
