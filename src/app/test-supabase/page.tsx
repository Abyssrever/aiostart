'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('客户端环境变量:', {
  url: supabaseUrl,
  key: supabaseKey?.substring(0, 20) + '...'
})

const supabase = createClient(supabaseUrl!, supabaseKey!)

export default function TestSupabase() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('123456')

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult('Testing...')

    try {
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')

      // 测试基本连接
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        setTestResult(`连接测试失败: ${error.message}`)
      } else {
        setTestResult(`连接测试成功! 用户状态: ${data.user ? '已登录' : '未登录'}`)
      }
    } catch (error) {
      console.error('Supabase测试错误:', error)
      setTestResult(`连接测试异常: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async () => {
    setIsLoading(true)
    setTestResult('尝试登录...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setTestResult(`登录失败: ${error.message}`)
      } else {
        setTestResult(`登录成功! 用户ID: ${data.user?.id}`)
      }
    } catch (error) {
      console.error('登录测试错误:', error)
      setTestResult(`登录测试异常: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testDatabase = async () => {
    setIsLoading(true)
    setTestResult('测试数据库连接...')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        setTestResult(`数据库测试失败: ${error.message}`)
      } else {
        setTestResult(`数据库连接成功! 查询结果: ${JSON.stringify(data)}`)
      }
    } catch (error) {
      console.error('数据库测试错误:', error)
      setTestResult(`数据库测试异常: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Supabase 连接测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">环境配置</h3>
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">测试操作</h3>
            <div className="flex space-x-2">
              <Button onClick={testConnection} disabled={isLoading}>
                测试连接
              </Button>
              <Button onClick={testDatabase} disabled={isLoading}>
                测试数据库
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">登录测试</h3>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={testLogin} disabled={isLoading}>
                测试登录
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">测试结果</h3>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[100px]">
              <pre className="whitespace-pre-wrap">{testResult || '点击上面的按钮开始测试'}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}