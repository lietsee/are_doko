import { useEffect } from 'react'
import './App.css'
import { useStorageStore } from './stores/storageStore'
import { useAuthStore } from './stores/authStore'
import { MainView } from './pages/MainView'
import { RegistrationView } from './pages/RegistrationView'
import { LoginPage } from './pages/LoginPage'

function App() {
  // 認証状態
  const { user, loading: authLoading, initialize: initAuth } = useAuthStore()

  const viewMode = useStorageStore((state) => state.viewMode)
  const loading = useStorageStore((state) => state.loading)
  const error = useStorageStore((state) => state.error)
  const loadWarehouses = useStorageStore((state) => state.loadWarehouses)

  // 認証の初期化
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // 初回データ読み込み（認証済みの場合のみ）
  useEffect(() => {
    if (authLoading || !user) return
    loadWarehouses()
  }, [authLoading, user, loadWarehouses])

  // 認証中
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-600">認証確認中...</div>
      </div>
    )
  }

  // 未認証
  if (!user) {
    return <LoginPage />
  }

  // 初回ロード中のエラー
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => loadWarehouses()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return viewMode === 'view' ? <MainView /> : <RegistrationView />
}

export default App
