import { useState, useCallback, useEffect, useMemo, type RefObject } from 'react'

interface UseImageZoomOptions {
  imageWidth: number
  imageHeight: number
  containerRef: RefObject<HTMLDivElement | null>
}

interface UseImageZoomResult {
  scale: number           // 相対倍率 1.0〜3.0（1.0 = 画面フィット）
  displayScale: number    // 実際の描画倍率（fitScale * scale）
  containerSize: { width: number; height: number }
  isReady: boolean
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  handleWheel: (e: WheelEvent) => void
}

const ZOOM_STEP = 0.1
const MIN_SCALE = 1.0
const MAX_SCALE = 3.0

export function useImageZoom({
  imageWidth,
  imageHeight,
  containerRef,
}: UseImageZoomOptions): UseImageZoomResult {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(MIN_SCALE)

  // コンテナサイズを監視
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }

    // 初期サイズ取得
    updateSize()

    // ResizeObserverでサイズ変更を監視
    const observer = new ResizeObserver(updateSize)
    observer.observe(container)

    return () => observer.disconnect()
  }, [containerRef])

  // 画面フィット時の倍率を計算（内部用）
  const fitScale = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1
    if (imageWidth === 0 || imageHeight === 0) return 1

    return Math.min(
      containerSize.width / imageWidth,
      containerSize.height / imageHeight
    )
  }, [containerSize.width, containerSize.height, imageWidth, imageHeight])

  // 実際の描画倍率
  const displayScale = fitScale * scale

  // コンテナが測定されるまで準備未完了
  const isReady = containerSize.width > 0 && containerSize.height > 0
    && imageWidth > 0 && imageHeight > 0

  // 画像変更時にscaleをリセット
  useEffect(() => {
    setScale(MIN_SCALE)
  }, [imageWidth, imageHeight])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(MIN_SCALE)
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setScale((prev) => {
      const newScale = prev + delta
      return Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE))
    })
  }, [])

  return {
    scale,
    displayScale,
    containerSize,
    isReady,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
  }
}
