'use client'

import LoginForm from '@/components/auth/LoginForm'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">启明星平台</h1>
          <p className="text-gray-600">个人成长与学习管理系统</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  )
}