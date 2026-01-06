import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MainView } from './MainView'
import { useStorageStore } from '../stores/storageStore'

describe('MainView', () => {
  beforeEach(() => {
    // ストアをリセット
    useStorageStore.setState({
      warehouses: [
        {
          id: 'w1',
          name: '第一倉庫',
          memo: '',
          photos: [
            {
              id: 'p1',
              name: '棚上段',
              imageDataUrl: 'data:image/png;base64,photo1',
              width: 800,
              height: 600,
              objects: [
                {
                  id: 'o1',
                  name: 'ハンマー',
                  memo: '棚の上',
                  clippedImageDataUrl: 'data:image/png;base64,clip1',
                  mask: { type: 'rect', x: 100, y: 100, width: 50, height: 50 },
                  clickPoint: { x: 125, y: 125 },
                  createdAt: '2025-01-06T12:00:00.000Z',
                  updatedAt: '2025-01-06T12:00:00.000Z',
                },
              ],
              createdAt: '2025-01-06T12:00:00.000Z',
              updatedAt: '2025-01-06T12:00:00.000Z',
            },
          ],
          createdAt: '2025-01-06T12:00:00.000Z',
          updatedAt: '2025-01-06T12:00:00.000Z',
        },
      ],
      currentWarehouseId: 'w1',
      currentPhotoId: 'p1',
      selectedObjectId: null,
      viewMode: 'view',
      inputMode: 'rect',
      version: '1.0.0',
      createdAt: '2025-01-06T12:00:00.000Z',
      updatedAt: '2025-01-06T12:00:00.000Z',
    })
  })

  it('サイドバーを表示する', () => {
    render(<MainView />)

    expect(screen.getByText('倉庫一覧')).toBeInTheDocument()
    // 第一倉庫はサイドバーとツールバーの2箇所に表示される
    expect(screen.getAllByText('第一倉庫').length).toBeGreaterThanOrEqual(1)
  })

  it('写真ビューアを表示する', () => {
    render(<MainView />)

    expect(screen.getByRole('img', { name: '棚上段' })).toBeInTheDocument()
  })

  it('オブジェクトをクリックするとポップアップを表示する', async () => {
    const user = userEvent.setup()
    render(<MainView />)

    await user.click(screen.getByTestId('overlay-o1'))

    expect(screen.getByText('ハンマー')).toBeInTheDocument()
    expect(screen.getByText('棚の上')).toBeInTheDocument()
  })

  it('ポップアップの閉じるボタンでポップアップを閉じる', async () => {
    const user = userEvent.setup()
    render(<MainView />)

    // ポップアップを開く
    await user.click(screen.getByTestId('overlay-o1'))
    expect(screen.getByText('ハンマー')).toBeInTheDocument()

    // ポップアップを閉じる
    await user.click(screen.getByRole('button', { name: '閉じる' }))

    // ポップアップが閉じた（編集ボタンがなくなる）
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument()
    })
  })

  it('登録モードに切り替えできる', async () => {
    const user = userEvent.setup()
    render(<MainView />)

    await user.click(screen.getByRole('button', { name: '登録モード' }))

    expect(useStorageStore.getState().viewMode).toBe('registration')
  })

  it('写真が選択されていない場合はプレースホルダーを表示', () => {
    useStorageStore.setState({ currentPhotoId: null })
    render(<MainView />)

    expect(screen.getByText('写真を選択してください')).toBeInTheDocument()
  })
})
