'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  GitBranch, 
  Clock, 
  User, 
  Tag,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface GitCommit {
  id: string
  hash: string
  message: string
  author: string
  date: string
  refs: string
  version: string
}

interface GitCommitsResponse {
  success: boolean
  data: GitCommit[]
  total: number
  error?: string
  message?: string
}

export default function GitUpdateLogger() {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const fetchCommits = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/git-commits')
      const data: GitCommitsResponse = await response.json()
      
      if (data.success) {
        setCommits(data.data)
      } else {
        setError(data.error || '获取提交记录失败')
      }
    } catch (err) {
      console.error('获取Git提交记录错误:', err)
      setError('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  // 当弹窗打开时自动加载数据
  useEffect(() => {
    if (isOpen) {
      fetchCommits()
    }
  }, [isOpen])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (index: number) => {
    if (index === 0) return 'bg-green-100 text-green-800 border-green-300'
    if (index < 3) return 'bg-blue-100 text-blue-800 border-blue-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            更新日志
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5" />
              <span>项目更新日志</span>
            </DialogTitle>
            <DialogDescription>
              查看项目的Git提交记录和版本更新历史
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {commits.length > 0 && `共 ${commits.length} 条更新记录`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCommits}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>

          <ScrollArea className="h-[400px] w-full pr-4">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">加载中...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {!loading && !error && commits.length === 0 && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无更新记录</p>
                </div>
              </div>
            )}

            {!loading && !error && commits.length > 0 && (
              <div className="space-y-4">
                {commits.map((commit, index) => (
                  <div
                    key={commit.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors break-words"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(index)} font-mono text-xs`}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {commit.version}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="default" className="bg-green-600">
                            最新
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        #{commit.id}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1 break-words overflow-wrap-anywhere">
                        {commit.message}
                      </h4>
                      {commit.refs && (
                        <div className="text-xs text-blue-600">
                          {commit.refs.replace(/[()]/g, '')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          <span>{commit.author}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formatDate(commit.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}