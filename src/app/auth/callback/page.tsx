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
        console.log('处理Supabase认证回调...')
        
        // 从URL hash中获取认证数据
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('认证回调错误:', error)
          router.push('/login?error=' + encodeURIComponent(error.message))
          return
        }

        if (data.session?.user) {
          console.log('邮箱验证成功，用户已登录:', data.session.user.email)
          
          // 检查是否是邮箱确认回调
          if (data.session.user.email_confirmed_at) {
            console.log('邮箱已确认，跳转到登录页面显示成功消息')
            router.push('/login?verified=true&email=' + encodeURIComponent(data.session.user.email || ''))
          } else {
            // 直接跳转到dashboard
            router.push('/dashboard')
          }
        } else {
          console.log('没有有效会话，跳转到登录页')
          router.push('/login?message=' + encodeURIComponent('请重新登录'))
        }
      } catch (error) {
        console.error('处理认证回调时出错:', error)
        router.push('/login?error=' + encodeURIComponent('验证失败，请重试'))
      }
    }

    // 延迟执行，确保URL参数已加载
    const timer = setTimeout(handleAuthCallback, 1000)
    
    return () => clearTimeout(timer)
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