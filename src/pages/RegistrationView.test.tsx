import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegistrationView } from './RegistrationView'
import { useStorageStore } from '../stores/storageStore'

// clipImageをモック
vi.mock('../utils/imageUtils', () => ({
  clipImage: vi.fn().mockResolvedValue('data:image/png;base64,clipped'),
}))

describe('RegistrationView', () => {
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
              objects: [],
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
      viewMode: 'registration',
      inputMode: 'rect',
      version: '1.0.0',
      createdAt: '2025-01-06T12:00:00.000Z',
      updatedAt: '2025-01-06T12:00:00.000Z',
    })
  })

  it('矩形選択モードを表示する', () => {
    render(<RegistrationView />)

    expect(screen.getByText(/ドラッグ/)).toBeInTheDocument()
  })

  it('閲覧モードに戻れる', async () => {
    const user = userEvent.setup()
    render(<RegistrationView />)

    await user.click(screen.getByRole('button', { name: '閲覧モード' }))

    expect(useStorageStore.getState().viewMode).toBe('view')
  })

  it('写真が選択されていない場合はプレースホルダーを表示', () => {
    useStorageStore.setState({ currentPhotoId: null })
    render(<RegistrationView />)

    expect(screen.getByText('写真を選択してください')).toBeInTheDocument()
  })

  it('矩形選択後にオブジェクトフォームを表示する', async () => {
    render(<RegistrationView />)

    const canvas = screen.getByTestId('rect-selector-canvas')

    // getBoundingClientRectをモック
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    } as DOMRect)

    // 矩形選択
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 })

    // フォームが表示される
    await waitFor(() => {
      expect(screen.getByLabelText('名前')).toBeInTheDocument()
    })
  })

  it('フォームで保存するとオブジェクトが追加される', async () => {
    const user = userEvent.setup()
    render(<RegistrationView />)

    const canvas = screen.getByTestId('rect-selector-canvas')

    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    } as DOMRect)

    // 矩形選択
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 })

    // フォームに入力
    await waitFor(() => {
      expect(screen.getByLabelText('名前')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('名前'), 'ハンマー')
    await user.type(screen.getByLabelText('メモ'), '棚の上')
    await user.click(screen.getByRole('button', { name: '保存' }))

    // オブジェクトが追加された
    await waitFor(() => {
      const state = useStorageStore.getState()
      const photo = state.warehouses[0].photos[0]
      expect(photo.objects.length).toBe(1)
      expect(photo.objects[0].name).toBe('ハンマー')
    })
  })

  it('フォームでキャンセルすると矩形選択モードに戻る', async () => {
    const user = userEvent.setup()
    render(<RegistrationView />)

    const canvas = screen.getByTestId('rect-selector-canvas')

    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    } as DOMRect)

    // 矩形選択
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 })

    // フォームが表示される
    await waitFor(() => {
      expect(screen.getByLabelText('名前')).toBeInTheDocument()
    })

    // キャンセル
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    // 矩形選択モードに戻る
    await waitFor(() => {
      expect(screen.getByText(/ドラッグ/)).toBeInTheDocument()
    })
  })
})
