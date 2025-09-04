/**
 * API速率限制器
 * 防止恶意请求和DoS攻击
 */

interface RateLimitConfig {
  windowMs: number  // 时间窗口（毫秒）
  maxRequests: number  // 最大请求数
  message?: string  // 限制消息
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>()
  
  constructor(private config: RateLimitConfig) {}
  
  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const record = this.store.get(identifier)
    
    // 清理过期记录
    if (record && now > record.resetTime) {
      this.store.delete(identifier)
    }
    
    const currentRecord = this.store.get(identifier)
    
    if (!currentRecord) {
      // 首次请求
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }
    
    if (currentRecord.count >= this.config.maxRequests) {
      // 超出限制
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentRecord.resetTime
      }
    }
    
    // 更新计数
    currentRecord.count++
    return {
      allowed: true,
      remaining: this.config.maxRequests - currentRecord.count,
      resetTime: currentRecord.resetTime
    }
  }
  
  // 清理过期记录（定期调用）
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// 不同API的速率限制配置
export const API_RATE_LIMITS = {
  // AI聊天API - 较严格限制
  'ai-chat': new InMemoryRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10, // 每分钟最多10次
    message: 'AI聊天请求过于频繁，请稍后再试'
  }),
  
  // 文件上传API - 中等限制
  'file-upload': new InMemoryRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5, // 每分钟最多5次
    message: '文件上传过于频繁，请稍后再试'
  }),
  
  // 认证API - 严格限制防止暴力破解
  'auth': new InMemoryRateLimiter({
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5, // 每15分钟最多5次
    message: '登录尝试过于频繁，请15分钟后再试'
  }),
  
  // 文档上传API - 中等限制
  'document-upload': new InMemoryRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 3, // 每分钟最多3次
    message: '文档上传过于频繁，请稍后再试'
  }),
  
  // 知识库搜索API - 宽松限制
  'knowledge-search': new InMemoryRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 20, // 每分钟最多20次
    message: '知识库搜索过于频繁，请稍后再试'
  }),
  
  // 任务创建API - 中等限制
  'task-create': new InMemoryRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10, // 每分钟最多10次
    message: '任务创建过于频繁，请稍后再试'
  }),
  
  // 队列创建API - 中等限制
  'queue-create': new InMemoryRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5, // 每分钟最多5次
    message: '队列创建过于频繁，请稍后再试'
  }),
  
  // 一般API - 宽松限制
  'general': new InMemoryRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 30, // 每分钟最多30次
    message: '请求过于频繁，请稍后再试'
  })
}

// 中间件函数
export async function applyRateLimit(
  identifier: string,
  limitType: keyof typeof API_RATE_LIMITS = 'general'
): Promise<{ allowed: boolean; headers: Record<string, string>; message?: string }> {
  const limiter = API_RATE_LIMITS[limitType]
  const result = await limiter.checkLimit(identifier)
  
  const headers = {
    'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  }
  
  return {
    allowed: result.allowed,
    headers,
    message: result.allowed ? undefined : limiter['config'].message
  }
}

// 获取客户端IP地址
export function getClientIP(request: Request): string {
  // 依次尝试各种获取IP的方法
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const cloudflare = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real
  }
  
  if (cloudflare) {
    return cloudflare
  }
  
  // 回退到默认值（开发环境）
  return '127.0.0.1'
}

// 定期清理过期记录
setInterval(() => {
  Object.values(API_RATE_LIMITS).forEach(limiter => {
    limiter.cleanup()
  })
}, 5 * 60 * 1000) // 每5分钟清理一次