'use client'

import { useState, useEffect, useCallback } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

interface UseDataCacheOptions {
  ttl?: number // 缓存时间（毫秒）
  staleWhileRevalidate?: boolean // 是否在后台更新过期数据
  key?: string // 缓存键
}

interface UseDataCacheReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  clearCache: () => void
  isStale: boolean
}

// 内存缓存存储
const memoryCache = new Map<string, CacheItem<any>>()

// 会话存储缓存
const getSessionCache = <T>(key: string): CacheItem<T> | null => {
  try {
    const cached = sessionStorage.getItem(`cache_${key}`)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

const setSessionCache = <T>(key: string, item: CacheItem<T>) => {
  try {
    sessionStorage.setItem(`cache_${key}`, JSON.stringify(item))
  } catch {
    // 忽略存储错误
  }
}

const removeSessionCache = (key: string) => {
  try {
    sessionStorage.removeItem(`cache_${key}`)
  } catch {
    // 忽略删除错误
  }
}

export function useDataCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: UseDataCacheOptions = {}
): UseDataCacheReturn<T> {
  const {
    ttl = 5 * 60 * 1000, // 默认5分钟
    staleWhileRevalidate = true,
    key = cacheKey
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isStale, setIsStale] = useState(false)

  // 检查缓存是否过期
  const isCacheExpired = useCallback((item: CacheItem<T>): boolean => {
    return Date.now() - item.timestamp > item.ttl
  }, [])

  // 从缓存获取数据
  const getCachedData = useCallback((): CacheItem<T> | null => {
    // 优先从内存缓存获取
    const memoryItem = memoryCache.get(key)
    if (memoryItem) {
      return memoryItem
    }

    // 从会话存储获取
    return getSessionCache<T>(key)
  }, [key])

  // 设置缓存
  const setCachedData = useCallback((newData: T) => {
    const cacheItem: CacheItem<T> = {
      data: newData,
      timestamp: Date.now(),
      ttl
    }

    // 设置内存缓存
    memoryCache.set(key, cacheItem)
    
    // 设置会话存储缓存
    setSessionCache(key, cacheItem)
  }, [key, ttl])

  // 获取数据
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true)
    }
    setError(null)

    try {
      console.log(`🔄 ${isBackground ? '后台' : ''}获取数据: ${key}`)
      const result = await fetcher()
      
      setData(result)
      setCachedData(result)
      setIsStale(false)
      
      console.log(`✅ 数据获取成功: ${key}`)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('数据获取失败')
      setError(error)
      console.error(`❌ 数据获取失败: ${key}`, error)
      throw error
    } finally {
      if (!isBackground) {
        setLoading(false)
      }
    }
  }, [key, fetcher, setCachedData])

  // 刷新数据
  const refresh = useCallback(async () => {
    // 清除缓存
    memoryCache.delete(key)
    removeSessionCache(key)
    
    // 重新获取数据
    await fetchData()
  }, [key, fetchData])

  // 清除缓存
  const clearCache = useCallback(() => {
    memoryCache.delete(key)
    removeSessionCache(key)
    setData(null)
    setIsStale(false)
  }, [key])

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      const cachedItem = getCachedData()
      
      if (cachedItem) {
        const expired = isCacheExpired(cachedItem)
        
        if (!expired) {
          // 缓存有效，直接使用
          console.log(`📦 使用缓存数据: ${key}`)
          setData(cachedItem.data)
          setIsStale(false)
          return
        } else if (staleWhileRevalidate) {
          // 缓存过期但启用了 stale-while-revalidate
          console.log(`📦 使用过期缓存数据: ${key}`)
          setData(cachedItem.data)
          setIsStale(true)
          
          // 后台更新数据
          try {
            await fetchData(true)
          } catch {
            // 后台更新失败，继续使用过期数据
          }
          return
        }
      }

      // 没有缓存或缓存过期且不使用 stale-while-revalidate
      await fetchData()
    }

    initializeData()
  }, [key, getCachedData, isCacheExpired, staleWhileRevalidate, fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    isStale
  }
}

// 预加载数据的Hook
export function usePrefetchData<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: UseDataCacheOptions = {}
) {
  const prefetch = useCallback(async () => {
    const { ttl = 5 * 60 * 1000 } = options
    const key = options.key || cacheKey
    
    // 检查是否已有有效缓存
    const memoryItem = memoryCache.get(key)
    if (memoryItem && Date.now() - memoryItem.timestamp < memoryItem.ttl) {
      return // 已有有效缓存，无需预加载
    }

    const sessionItem = getSessionCache<T>(key)
    if (sessionItem && Date.now() - sessionItem.timestamp < sessionItem.ttl) {
      // 将会话缓存加载到内存
      memoryCache.set(key, sessionItem)
      return
    }

    // 预加载数据
    try {
      console.log(`🚀 预加载数据: ${key}`)
      const result = await fetcher()
      
      const cacheItem: CacheItem<T> = {
        data: result,
        timestamp: Date.now(),
        ttl
      }

      memoryCache.set(key, cacheItem)
      setSessionCache(key, cacheItem)
      
      console.log(`✅ 预加载完成: ${key}`)
    } catch (error) {
      console.warn(`⚠️ 预加载失败: ${key}`, error)
    }
  }, [cacheKey, fetcher, options])

  return { prefetch }
}

// 批量清除缓存
export function clearAllCache() {
  memoryCache.clear()
  
  // 清除会话存储中的缓存
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch {
    // 忽略清除错误
  }
  
  console.log('🧹 已清除所有缓存')
}