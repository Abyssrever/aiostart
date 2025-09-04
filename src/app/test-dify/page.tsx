'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

export default function TestDifyPage() {
  const [message, setMessage] = useState('你好，我是启明星教育平台的学生，请介绍一下你的功能')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [healthStatus, setHealthStatus] = useState<any>(null)

  const testDifyAPI = async () => {
    setIsLoading(true)
    setResponse(null)
    
    try {
      const res = await fetch('/api/test-dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })
      
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/test-dify', {
        method: 'GET'
      })
      
      const data = await res.json()
      setHealthStatus(data)
    } catch (error) {
      setHealthStatus({
        status: 'error',
        error: error instanceof Error ? error.message : '健康检查失败'
      })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dify AI 服务测试</h1>
        <p className="text-gray-600">测试Dify API集成是否正常工作</p>
      </div>

      {/* 健康检查 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            服务健康检查
            <Button onClick={checkHealth} variant="outline" size="sm">
              检查状态
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthStatus.status}
                </Badge>
                <span className="text-sm">{healthStatus.message || healthStatus.error}</span>
              </div>
              {healthStatus.config && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div>Provider: {healthStatus.config.provider}</div>
                  <div>Base URL: {healthStatus.config.baseUrl}</div>
                  <div>App ID: {healthStatus.config.appId}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">点击"检查状态"按钮进行健康检查</p>
          )}
        </CardContent>
      </Card>

      {/* API测试 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API 测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">测试消息</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入要发送给AI的消息..."
              className="min-h-[100px]"
            />
          </div>
          
          <Button 
            onClick={testDifyAPI} 
            disabled={isLoading || !message.trim()}
            className="w-full"
          >
            {isLoading ? '发送中...' : '发送测试消息'}
          </Button>
        </CardContent>
      </Card>

      {/* 响应结果 */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>API 响应</span>
              <Badge variant={response.success ? 'default' : 'destructive'}>
                {response.success ? '成功' : '失败'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {response.success ? (
              <div className="space-y-4">
                {/* AI回复内容 */}
                <div>
                  <h4 className="font-medium mb-2">AI 回复:</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <p className="whitespace-pre-wrap">{response.response?.content}</p>
                  </div>
                </div>

                {/* 响应统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">响应时间</div>
                    <div className="font-medium">{response.response?.responseTime}ms</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Token使用</div>
                    <div className="font-medium">{response.response?.tokensUsed || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">会话ID</div>
                    <div className="font-medium text-xs">{response.response?.metadata?.conversationId || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">消息ID</div>
                    <div className="font-medium text-xs">{response.response?.metadata?.messageId || 'N/A'}</div>
                  </div>
                </div>

                {/* 知识库检索结果 */}
                {response.response?.metadata?.retrieverResources?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">知识库检索结果:</h4>
                    <div className="space-y-2">
                      {response.response.metadata.retrieverResources.map((resource: any, index: number) => (
                        <div key={index} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                          <div className="font-medium text-sm">{resource.document_name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            相关度: {(resource.score * 100).toFixed(1)}% | 数据集: {resource.dataset_name}
                          </div>
                          <div className="text-sm mt-2">{resource.content.substring(0, 200)}...</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 配置信息 */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-sm text-gray-600">配置信息</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(response.config, null, 2)}
                  </pre>
                </details>

                {/* 完整响应数据 */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-sm text-gray-600">完整响应数据</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(response.response, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 错误信息 */}
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  <h4 className="font-medium text-red-800 mb-2">错误信息:</h4>
                  <p className="text-red-700">{response.error}</p>
                </div>

                {/* 配置信息 */}
                {response.config && (
                  <div>
                    <h4 className="font-medium mb-2">当前配置:</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div>Provider: {response.config.provider}</div>
                      <div>Has API Key: {response.config.hasApiKey ? '✅' : '❌'}</div>
                      <div>Base URL: {response.config.baseUrl || 'N/A'}</div>
                      <div>App ID: {response.config.appId || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* 错误详情 */}
                {response.details && (
                  <details>
                    <summary className="cursor-pointer font-medium text-sm text-gray-600">错误详情</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {response.details}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>1. 首先点击"检查状态"确认Dify服务配置正确</p>
          <p>2. 在测试消息框中输入要发送的消息</p>
          <p>3. 点击"发送测试消息"测试API调用</p>
          <p>4. 查看响应结果，包括AI回复、响应时间、Token使用量等</p>
          <p>5. 如果有知识库集成，还会显示相关的检索结果</p>
        </CardContent>
      </Card>
    </div>
  )
}