import { useEffect, useState } from 'react'
import './App.css'
import { useStorageStore } from './stores/storageStore'
import { MainView } from './pages/MainView'
import { RegistrationView } from './pages/RegistrationView'
import { loadAppData, saveAppData } from './utils/idb'
import type { AppData } from './types/storage'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const viewMode = useStorageStore((state) => state.viewMode)
  const warehouses = useStorageStore((state) => state.warehouses)
  const version = useStorageStore((state) => state.version)
  const createdAt = useStorageStore((state) => state.createdAt)
  const updatedAt = useStorageStore((state) => state.updatedAt)
  const setInitialData = useStorageStore((state) => state.setInitialData)

  // 初回読み込み
  useEffect(() => {
    async function load() {
      try {
        const data = await loadAppData()
        if (data) {
          setInitialData(data)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('データの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [setInitialData])

  // データ変更時に自動保存
  useEffect(() => {
    if (isLoading) return

    async function save() {
      try {
        const data: AppData = {
          version,
          warehouses,
          createdAt,
          updatedAt,
        }
        await saveAppData(data)
      } catch (err) {
        console.error('Failed to save data:', err)
      }
    }
    save()
  }, [warehouses, version, createdAt, updatedAt, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return viewMode === 'view' ? <MainView /> : <RegistrationView />
}

export default App
