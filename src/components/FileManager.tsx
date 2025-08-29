'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Upload, Filter, Grid, List, Trash2, Download, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import FileUpload from './FileUpload'
import FileViewer from './FileViewer'

interface FileInfo {
  id: string
  name: string
  originalName: string
  fileName: string
  path: string
  size: number
  type: string
  category: string
  uploadedAt: string
  userId: string
}

interface FileManagerProps {
  category?: string
  allowUpload?: boolean
  className?: string
}

const FileManager: React.FC<FileManagerProps> = ({
  category,
  allowUpload = true,
  className = ''
}) => {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>(category || 'all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const categories = [
    { value: 'all', label: '全部文件' },
    { value: 'general', label: '通用文件' },
    { value: 'chat', label: '聊天文件' },
    { value: 'okr', label: '目标任务' },
    { value: 'assignment', label: '作业文件' },
    { value: 'profile', label: '个人资料' },
    { value: 'document', label: '文档资料' }
  ]

  const loadFiles = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        userId: user.id
      })
      
      if (filterCategory !== 'all') {
        params.append('category', filterCategory)
      }

      const response = await fetch(`/api/files/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setFiles(data.files)
      } else {
        setError(data.error || '获取文件列表失败')
      }
    } catch (error) {
      console.error('获取文件列表错误:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (uploadedFiles: FileInfo[]) => {
    setFiles(prev => [...uploadedFiles, ...prev])
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      // 这里应该调用删除API
      setFiles(prev => prev.filter(f => f.id !== fileId))
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    } catch (error) {
      console.error('删除文件错误:', error)
      setError('删除文件失败')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) {
      return
    }

    try {
      // 批量删除逻辑
      for (const fileId of selectedFiles) {
        await handleDeleteFile(fileId)
      }
      setSelectedFiles(new Set())
    } catch (error) {
      console.error('批量删除错误:', error)
      setError('批量删除失败')
    }
  }

  const handleSelectFile = (fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || file.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    if (user) {
      loadFiles()
    }
  }, [user, filterCategory])

  const FileCard: React.FC<{ file: FileInfo }> = ({ file }) => (
    <Card className="relative group">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={selectedFiles.has(file.id)}
            onChange={(e) => handleSelectFile(file.id, e.target.checked)}
            className="mt-1"
          />
          <div className="flex-1">
            <FileViewer
              file={file}
              showActions={false}
              className="border-0 shadow-none"
            />
          </div>
        </div>
        
        <div className="mt-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(file.path, '_blank')}
          >
            <Eye className="w-3 h-3 mr-1" />
            查看
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a')
              link.href = file.path
              link.download = file.name
              link.click()
            }}
          >
            <Download className="w-3 h-3 mr-1" />
            下载
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteFile(file.id)}
            className="text-red-600"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const FileListItem: React.FC<{ file: FileInfo }> = ({ file }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <input
        type="checkbox"
        checked={selectedFiles.has(file.id)}
        onChange={(e) => handleSelectFile(file.id, e.target.checked)}
      />
      <div className="flex-1">
        <FileViewer
          file={file}
          showActions={true}
          onDelete={handleDeleteFile}
          className="border-0 shadow-none bg-transparent"
        />
      </div>
    </div>
  )

  if (!user) {
    return (
      <Alert>
        <AlertDescription>请先登录以查看文件</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>文件管理</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              {selectedFiles.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  删除选中 ({selectedFiles.size})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索文件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {!category && (
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Tabs defaultValue="files">
            <TabsList>
              <TabsTrigger value="files">
                文件列表 ({filteredFiles.length})
              </TabsTrigger>
              {allowUpload && (
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-1" />
                  上传文件
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="files" className="mt-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  加载中...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || filterCategory !== 'all' ? '没有找到匹配的文件' : '暂无文件'}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 border-b">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span className="text-sm text-gray-600">
                      全选 ({selectedFiles.size}/{filteredFiles.length})
                    </span>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFiles.map(file => (
                        <FileCard key={file.id} file={file} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFiles.map(file => (
                        <FileListItem key={file.id} file={file} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {allowUpload && (
              <TabsContent value="upload" className="mt-4">
                <FileUpload
                  category={filterCategory as any}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={setError}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileManager