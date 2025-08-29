'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Eye, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  File, 
  ExternalLink,
  Trash2,
  Share2,
  Calendar,
  User
} from 'lucide-react'

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

interface FileViewerProps {
  file: FileInfo
  showActions?: boolean
  onDelete?: (fileId: string) => void
  onShare?: (fileId: string) => void
  className?: string
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  showActions = true,
  onDelete,
  onShare,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5" />
    if (mimeType.startsWith('video/')) return <FileVideo className="w-5 h-5" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-5 h-5" />
    if (mimeType === 'application/pdf' || mimeType.includes('document')) {
      return <FileText className="w-5 h-5" />
    }
    return <File className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryBadgeColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'general': 'bg-gray-100 text-gray-800',
      'chat': 'bg-blue-100 text-blue-800',
      'okr': 'bg-green-100 text-green-800',
      'assignment': 'bg-orange-100 text-orange-800',
      'profile': 'bg-purple-100 text-purple-800',
      'document': 'bg-indigo-100 text-indigo-800'
    }
    return colorMap[category] || colorMap['general']
  }

  const getCategoryLabel = (category: string) => {
    const labelMap: { [key: string]: string } = {
      'general': '通用',
      'chat': '聊天',
      'okr': '目标任务',
      'assignment': '作业',
      'profile': '个人资料',
      'document': '文档'
    }
    return labelMap[category] || category
  }

  const canPreview = (mimeType: string) => {
    return mimeType.startsWith('text/') || 
           mimeType.startsWith('image/') ||
           mimeType === 'application/json'
  }

  const loadPreview = async () => {
    if (!canPreview(file.type)) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(file.path)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (file.type.startsWith('image/')) {
        // 图片文件，设置路径用于显示
        setPreviewContent(file.path)
      } else {
        // 文本文件，读取内容
        const content = await response.text()
        setPreviewContent(content)
      }
    } catch (error) {
      console.error('预览加载失败:', error)
      setError(error instanceof Error ? error.message : '预览加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = file.path
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = () => {
    window.open(file.path, '_blank')
  }

  const handleDelete = () => {
    if (onDelete && confirm('确定要删除这个文件吗？')) {
      onDelete(file.id)
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(file.id)
    }
  }

  useEffect(() => {
    if (canPreview(file.type)) {
      loadPreview()
    }
  }, [file])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getFileIcon(file.type)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium text-gray-900 truncate">
                {file.name}
              </CardTitle>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(file.uploadedAt)}
                </span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            </div>
          </div>
          <Badge className={getCategoryBadgeColor(file.category)}>
            {getCategoryLabel(file.category)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 文件预览区域 */}
        {canPreview(file.type) && (
          <div className="mb-4">
            {isLoading && (
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">加载预览中...</div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {previewContent && !isLoading && !error && (
              <div className="border rounded-lg overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <div className="relative">
                    <img 
                      src={previewContent} 
                      alt={file.name}
                      className="w-full h-auto max-h-64 object-contain bg-gray-50"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {previewContent.length > 2000 
                        ? previewContent.substring(0, 2000) + '\n\n... (文件内容过长，已截断)'
                        : previewContent
                      }
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 文件信息 */}
        <div className="text-xs text-gray-500 space-y-1 mb-4">
          <div>文件类型: {file.type}</div>
          {file.fileName !== file.name && (
            <div>存储名称: {file.fileName}</div>
          )}
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="flex items-center space-x-1"
            >
              <Eye className="w-3 h-3" />
              <span>查看</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>下载</span>
            </Button>

            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-1"
              >
                <Share2 className="w-3 h-3" />
                <span>分享</span>
              </Button>
            )}

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
                <span>删除</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FileViewer