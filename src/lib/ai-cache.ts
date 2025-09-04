/**
 * AI响应缓存系统
 * 提高AI服务响应速度并减少API调用成本
 */

interface CacheItem {
  response: string
  timestamp: number
  expiresAt: number
  hits: number
}

class AICache {
  private cache = new Map<string, CacheItem>()
  private readonly DEFAULT_TTL = 30 * 60 * 1000 // 30分钟
  private readonly MAX_CACHE_SIZE = 1000

  // 生成缓存键
  private generateKey(query: string, sessionType: string = 'general'): string {
    // 对查询进行标准化处理
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ')
    return `${sessionType}:${normalizedQuery}`
  }

  // 获取缓存
  get(query: string, sessionType?: string): string | null {
    const key = this.generateKey(query, sessionType)
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // 增加命中次数
    item.hits++
    
    console.log(`🎯 AI缓存命中: ${key} (命中次数: ${item.hits})`)
    return item.response
  }

  // 设置缓存
  set(query: string, response: string, sessionType?: string, ttl: number = this.DEFAULT_TTL): void {
    // 检查缓存大小，如果超过限制则清理旧数据
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup()
    }

    const key = this.generateKey(query, sessionType)
    const now = Date.now()

    this.cache.set(key, {
      response,
      timestamp: now,
      expiresAt: now + ttl,
      hits: 0
    })

    console.log(`💾 AI缓存已设置: ${key}`)
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    // 如果清理后仍然太多，删除最旧的缓存
    if (this.cache.size > this.MAX_CACHE_SIZE * 0.8) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, this.cache.size - Math.floor(this.MAX_CACHE_SIZE * 0.7))

      entries.forEach(([key]) => {
        this.cache.delete(key)
        cleaned++
      })
    }

    if (cleaned > 0) {
      console.log(`🧹 AI缓存清理完成，清理了 ${cleaned} 条记录`)
    }
  }

  // 获取缓存统计
  getStats() {
    const now = Date.now()
    let validItems = 0
    let totalHits = 0

    for (const [, item] of this.cache.entries()) {
      if (now <= item.expiresAt) {
        validItems++
        totalHits += item.hits
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      totalHits,
      hitRate: validItems > 0 ? totalHits / validItems : 0
    }
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
    console.log('🗑️ AI缓存已清空')
  }
}

// 导出单例实例
export const aiCache = new AICache()

// 定期清理缓存
setInterval(() => {
  aiCache.cleanup()
}, 10 * 60 * 1000) // 每10分钟清理一次