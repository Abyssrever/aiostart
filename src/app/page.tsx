'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
<<<<<<< HEAD
    // 立即跳转到登录页面，无需延迟
    router.replace('/login')
=======
    // 使用 replace 而不是 push 来避免历史记录问题
    const timer = setTimeout(() => {
      router.replace('/login')
    }, 100)
    
    return () => clearTimeout(timer)
>>>>>>> bcb66815474adaa2f542b639cde27c0e04e13652
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">🌟</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">启明星平台</h1>
        <p className="text-gray-600">正在跳转到登录页面...</p>
      </div>
    </div>
  )
}
