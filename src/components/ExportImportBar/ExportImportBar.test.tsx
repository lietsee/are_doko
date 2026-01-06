import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportImportBar } from './ExportImportBar'

describe('ExportImportBar', () => {
  it('エクスポートボタンを表示する', () => {
    render(
      <ExportImportBar
        onExport={vi.fn()}
        onImport={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'エクスポート' })).toBeInTheDocument()
  })

  it('インポートボタンを表示する', () => {
    render(
      <ExportImportBar
        onExport={vi.fn()}
        onImport={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'インポート' })).toBeInTheDocument()
  })

  it('エクスポートボタンをクリックするとonExportが呼ばれる', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    render(
      <ExportImportBar
        onExport={onExport}
        onImport={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'エクスポート' }))

    expect(onExport).toHaveBeenCalled()
  })

  it('インポートボタンをクリックするとファイル選択が開く', () => {
    render(
      <ExportImportBar
        onExport={vi.fn()}
        onImport={vi.fn()}
      />
    )

    // ファイル入力要素が存在する
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })

  it('ファイルを選択するとonImportが呼ばれる', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    render(
      <ExportImportBar
        onExport={vi.fn()}
        onImport={onImport}
      />
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['{"version":"1.0","warehouses":[]}'], 'test.json', {
      type: 'application/json',
    })

    await user.upload(fileInput, file)

    expect(onImport).toHaveBeenCalledWith('{"version":"1.0","warehouses":[]}')
  })
})
