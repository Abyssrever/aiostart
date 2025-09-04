'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { Search, FileText, Calendar, Eye, Download, Trash2 } from 'lucide-react'
import DocumentUploader from './DocumentUploader'

interface KnowledgeDocument {
  id: string
  title: string
  content_preview: string
  document_type: string
  file_path: string
  created_at: string
  updated_at: string
  user_id: string
  project_id?: string
  organization_id?: string
  embedding_generated: boolean
  processing_status: 'pending' | 'processing' | 'completed' | 'error'
}

interface SearchResult {
  document: KnowledgeDocument
  similarity_score: number
  matched_content: string
}

interface KnowledgeManagerProps {
  projectId?: string
  organizationId?: string
}

export default function KnowledgeManager({ projectId, organizationId }: KnowledgeManagerProps) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'semantic' | 'fulltext' | 'hybrid'>('hybrid')
  const [filterType, setFilterType] = useState<string>('all')
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showUploader, setShowUploader] = useState(false)

  // 获取知识库文档列表
  const fetchDocuments = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        user_id: user.id,
        limit: '20',
        offset: '0'
      })
      
      if (projectId) params.append('project_id', projectId)
      if (organizationId) params.append('organization_id', organizationId)
      if (filterType !== 'all') params.append('document_type', filterType)

      const response = await fetch(`/api/knowledge/search?${params}`)
      const data = await response.json()

      if (data.success && data.documents) {
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('获取文档列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 搜索知识库
  const searchKnowledge = async () => {
    if (!searchQuery.trim() || !user?.id) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          user_id: user.id,
          search_type: searchType,
          project_id: projectId,
          organization_id: organizationId,
          limit: 10
        })
      })

      const data = await response.json()
      
      if (data.success && data.results) {
        setSearchResults(data.results)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('知识库搜索失败:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 删除文档
  const deleteDocument = async (documentId: string) => {
    if (!confirm('确定要删除这个文档吗？')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        setSearchResults(prev => prev.filter(result => result.document.id !== documentId))
      }
    } catch (error) {
      console.error('删除文档失败:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [user?.id, projectId, organizationId, filterType])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchKnowledge()
    }
  }

  const getStatusBadge = (status: string, embeddingGenerated: boolean) => {
    if (status === 'completed' && embeddingGenerated) {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">已就绪</Badge>
    } else if (status === 'processing') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">处理中</Badge>
    } else if (status === 'error') {
      return <Badge variant="destructive">处理失败</Badge>
    } else {
      return <Badge variant="outline">待处理</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">知识库管理</h2>
        <Button onClick={() => setShowUploader(!showUploader)}>
          {showUploader ? '隐藏上传' : '上传文档'}
        </Button>
      </div>

      {/* 文档上传组件 */}
      {showUploader && (
        <DocumentUploader
          projectId={projectId}
          organizationId={organizationId}
          onUploadComplete={() => fetchDocuments()}
        />
      )}

      {/* 搜索区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            知识库搜索
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="搜索知识库内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">智能搜索</SelectItem>
                <SelectItem value="semantic">语义搜索</SelectItem>
                <SelectItem value="fulltext">全文搜索</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={searchKnowledge} 
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? '搜索中...' : '搜索'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>搜索结果 ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div key={result.document.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium">{result.document.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          相似度: {(result.similarity_score * 100).toFixed(1)}%
                        </Badge>
                        {getStatusBadge(result.document.processing_status, result.document.embedding_generated)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {result.matched_content || result.document.content_preview}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(result.document.created_at)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {result.document.document_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 文档列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>文档库 ({documents.length})</CardTitle>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="general">通用文档</SelectItem>
                <SelectItem value="tutorial">教程资料</SelectItem>
                <SelectItem value="reference">参考资料</SelectItem>
                <SelectItem value="assignment">作业文档</SelectItem>
                <SelectItem value="manual">手册文档</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无文档，请上传文档开始建设知识库
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium">{doc.title}</h4>
                        {getStatusBadge(doc.processing_status, doc.embedding_generated)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {doc.content_preview}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(doc.created_at)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}