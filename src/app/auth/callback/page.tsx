'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 处理认证回调
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('认证回调错误:', error)
          router.push('/login?error=auth_failed')
          return
        }

        if (data.session) {
          // 认证成功，重定向到仪表板
          router.push('/dashboard')
        } else {
          // 没有会话，重定向到登录页
          router.push('/login')
        }
      } catch (error) {
        console.error('处理认证回调时出错:', error)
        router.push('/login?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">正在验证您的身份...</h2>
        <p className="text-gray-600">请稍候，我们正在处理您的登录请求</p>
      </div>
    </div>
  )
}