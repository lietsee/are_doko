import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SamSelector } from './SamSelector'

describe('SamSelector', () => {
  it('画像を表示する', () => {
    render(
      <SamSelector
        imageDataUrl="data:image/png;base64,xxx"
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('説明テキストを表示する', () => {
    render(
      <SamSelector
        imageDataUrl="data:image/png;base64,xxx"
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/クリックしてオブジェクトを検出/)).toBeInTheDocument()
  })

  it('キャンセルボタンを表示する', () => {
    render(
      <SamSelector
        imageDataUrl="data:image/png;base64,xxx"
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <SamSelector
        imageDataUrl="data:image/png;base64,xxx"
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('ローディング中はスピナーを表示する', () => {
    render(
      <SamSelector
        imageDataUrl="data:image/png;base64,xxx"
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
        isLoading={true}
      />
    )

    expect(screen.getByText('検出中...')).toBeInTheDocument()
  })

  it('エラーメッセージを表示する', () => {
    render(
      <SamSelector
        imageDataUrl="data:image/png;base64,xxx"
        imageWidth={800}
        imageHeight={600}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
        error="接続エラー"
      />
    )

    expect(screen.getByText('接続エラー')).toBeInTheDocument()
  })
})
