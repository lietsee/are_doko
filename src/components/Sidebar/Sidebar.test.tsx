import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'
import type { Warehouse } from '../../types/storage'

describe('Sidebar', () => {
  const mockWarehouses: Warehouse[] = [
    {
      id: 'w1',
      name: '第一倉庫',
      memo: '工具類',
      photos: [
        {
          id: 'p1',
          name: '棚上段',
          imageDataUrl: 'data:image/png;base64,xxx',
          width: 100,
          height: 100,
          objects: [],
          createdAt: '2025-01-06T12:00:00.000Z',
          updatedAt: '2025-01-06T12:00:00.000Z',
        },
        {
          id: 'p2',
          name: '棚下段',
          imageDataUrl: 'data:image/png;base64,yyy',
          width: 100,
          height: 100,
          objects: [],
          createdAt: '2025-01-06T12:00:00.000Z',
          updatedAt: '2025-01-06T12:00:00.000Z',
        },
      ],
      createdAt: '2025-01-06T12:00:00.000Z',
      updatedAt: '2025-01-06T12:00:00.000Z',
    },
    {
      id: 'w2',
      name: '第二倉庫',
      memo: '',
      photos: [],
      createdAt: '2025-01-06T12:00:00.000Z',
      updatedAt: '2025-01-06T12:00:00.000Z',
    },
  ]

  it('倉庫リストを表示する', () => {
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId={null}
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
      />
    )

    expect(screen.getByText('第一倉庫')).toBeInTheDocument()
    expect(screen.getByText('第二倉庫')).toBeInTheDocument()
  })

  it('倉庫をクリックすると写真リストを展開する', async () => {
    const user = userEvent.setup()
    const onSelectWarehouse = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId={null}
        currentPhotoId={null}
        onSelectWarehouse={onSelectWarehouse}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
      />
    )

    await user.click(screen.getByText('第一倉庫'))

    expect(onSelectWarehouse).toHaveBeenCalledWith('w1')
  })

  it('選択中の倉庫の写真リストを表示する', () => {
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
      />
    )

    expect(screen.getByText('棚上段')).toBeInTheDocument()
    expect(screen.getByText('棚下段')).toBeInTheDocument()
  })

  it('写真をクリックするとonSelectPhotoが呼ばれる', async () => {
    const user = userEvent.setup()
    const onSelectPhoto = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={onSelectPhoto}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
      />
    )

    await user.click(screen.getByText('棚上段'))

    expect(onSelectPhoto).toHaveBeenCalledWith('w1', 'p1')
  })

  it('倉庫追加ボタンをクリックするとonAddWarehouseが呼ばれる', async () => {
    const user = userEvent.setup()
    const onAddWarehouse = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId={null}
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={onAddWarehouse}
        onAddPhoto={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: '倉庫を追加' }))

    expect(onAddWarehouse).toHaveBeenCalled()
  })

  it('写真追加ボタンをクリックするとonAddPhotoが呼ばれる', async () => {
    const user = userEvent.setup()
    const onAddPhoto = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={onAddPhoto}
      />
    )

    await user.click(screen.getByRole('button', { name: '+ 写真を追加' }))

    expect(onAddPhoto).toHaveBeenCalledWith('w1')
  })

  it('選択中の写真がハイライトされる', () => {
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId="p1"
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
      />
    )

    const photoItem = screen.getByText('棚上段').closest('li')
    expect(photoItem).toHaveClass('bg-blue-100')
  })

  it('倉庫が空の場合は空のリストを表示する', () => {
    render(
      <Sidebar
        warehouses={[]}
        currentWarehouseId={null}
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
      />
    )

    expect(screen.getByText('倉庫がありません')).toBeInTheDocument()
  })

  it('倉庫編集ボタンをクリックするとonEditWarehouseが呼ばれる', async () => {
    const user = userEvent.setup()
    const onEditWarehouse = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
        onEditWarehouse={onEditWarehouse}
        onDeleteWarehouse={vi.fn()}
      />
    )

    // 倉庫が展開されている状態で編集ボタンをクリック
    const editButtons = screen.getAllByTitle('倉庫を編集')
    await user.click(editButtons[0])

    expect(onEditWarehouse).toHaveBeenCalledWith('w1')
  })

  it('倉庫削除ボタンをクリックするとonDeleteWarehouseが呼ばれる', async () => {
    const user = userEvent.setup()
    const onDeleteWarehouse = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
        onEditWarehouse={vi.fn()}
        onDeleteWarehouse={onDeleteWarehouse}
      />
    )

    const deleteButtons = screen.getAllByTitle('倉庫を削除')
    await user.click(deleteButtons[0])

    expect(onDeleteWarehouse).toHaveBeenCalledWith('w1')
  })

  it('写真編集ボタンをクリックするとonEditPhotoが呼ばれる', async () => {
    const user = userEvent.setup()
    const onEditPhoto = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
        onEditPhoto={onEditPhoto}
        onDeletePhoto={vi.fn()}
      />
    )

    const editButtons = screen.getAllByTitle('写真を編集')
    await user.click(editButtons[0])

    expect(onEditPhoto).toHaveBeenCalledWith('w1', 'p1')
  })

  it('写真削除ボタンをクリックするとonDeletePhotoが呼ばれる', async () => {
    const user = userEvent.setup()
    const onDeletePhoto = vi.fn()
    render(
      <Sidebar
        warehouses={mockWarehouses}
        currentWarehouseId="w1"
        currentPhotoId={null}
        onSelectWarehouse={vi.fn()}
        onSelectPhoto={vi.fn()}
        onAddWarehouse={vi.fn()}
        onAddPhoto={vi.fn()}
        onEditPhoto={vi.fn()}
        onDeletePhoto={onDeletePhoto}
      />
    )

    const deleteButtons = screen.getAllByTitle('写真を削除')
    await user.click(deleteButtons[0])

    expect(onDeletePhoto).toHaveBeenCalledWith('w1', 'p1')
  })
})
