'use client'

import { useEffect, useCallback } from 'react'

interface UseWindowResizeOptions {
  debounceMs?: number
  onResize?: () => void
}

export function useWindowResize(options: UseWindowResizeOptions = {}) {
  const { debounceMs = 300, onResize } = options

  const handleResize = useCallback(() => {
    if (onResize) {
      onResize()
    }
  }, [onResize])

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout

    const debouncedResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, debounceMs)
    }

    // 添加防抖的窗口大小变化监听
    window.addEventListener('resize', debouncedResize)

    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(resizeTimeout)
    }
  }, [handleResize, debounceMs])
}