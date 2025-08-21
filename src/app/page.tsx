'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到登录页面
    router.push('/login')
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
