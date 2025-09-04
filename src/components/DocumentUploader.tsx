'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

interface DocumentUploaderProps {
  projectId?: string
  organizationId?: string
  onUploadComplete?: (result: any) => void
  onUploadError?: (error: string) => void
}

interface UploadFile {
  id: string
  file: File
  title: string
  documentType: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  result?: any
  error?: string
}

export default function DocumentUploader({
  projectId,
  organizationId,
  onUploadComplete,
  onUploadError
}: DocumentUploaderProps) {
  const { user } = useAuth()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [defaultDocumentType, setDefaultDocumentType] = useState('general')
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}_${Math.random()}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名作为默认标题
      documentType: defaultDocumentType,
      status: 'pending',
      progress: 0
    }))
    
    setUploadFiles(prev => [...prev, ...newFiles])
  }, [defaultDocumentType])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ))
  }

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id))
  }

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    if (!user?.id) {
      updateFile(uploadFile.id, { 
        status: 'error', 
        error: '用户未登录' 
      })
      return
    }

    const formData = new FormData()
    formData.append('file', uploadFile.file)
    formData.append('title', uploadFile.title)
    formData.append('user_id', user.id)
    formData.append('document_type', uploadFile.documentType)
    
    if (projectId) {
      formData.append('project_id', projectId)
    }
    if (organizationId) {
      formData.append('organization_id', organizationId)
    }

    try {
      updateFile(uploadFile.id, { status: 'uploading', progress: 20 })

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      updateFile(uploadFile.id, { progress: 60 })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || result.details || '上传失败')
      }

      updateFile(uploadFile.id, { 
        status: 'processing',
        progress: 80
      })

      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      updateFile(uploadFile.id, { 
        status: 'completed',
        progress: 100,
        result: result.data
      })

      onUploadComplete?.(result.data)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      updateFile(uploadFile.id, { 
        status: 'error', 
        error: errorMessage,
        progress: 0
      })
      
      onUploadError?.(errorMessage)
    }
  }

  const handleUploadAll = async () => {
    const pendingFiles = uploadFiles.filter(file => file.status === 'pending')
    
    if (pendingFiles.length === 0) {
      return
    }

    setIsUploading(true)

    try {
      // 并发上传文件（限制并发数）
      const concurrencyLimit = 3
      for (let i = 0; i < pendingFiles.length; i += concurrencyLimit) {
        const batch = pendingFiles.slice(i, i + concurrencyLimit)
        await Promise.allSettled(batch.map(file => uploadSingleFile(file)))
      }
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'uploading':
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待上传'
      case 'uploading': return '上传中...'
      case 'processing': return '处理中...'
      case 'completed': return '完成'
      case 'error': return '失败'
      default: return status
    }
  }

  const completedFiles = uploadFiles.filter(file => file.status === 'completed')
  const errorFiles = uploadFiles.filter(file => file.status === 'error')
  const pendingFiles = uploadFiles.filter(file => file.status === 'pending')

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            文档上传
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={defaultDocumentType} onValueChange={setDefaultDocumentType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">通用文档</SelectItem>
                <SelectItem value="tutorial">教程资料</SelectItem>
                <SelectItem value="reference">参考资料</SelectItem>
                <SelectItem value="assignment">作业文档</SelectItem>
                <SelectItem value="manual">手册文档</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 拖放区域 */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50 text-blue-600' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">
              释放文件以开始上传...
            </p>
          ) : (
            <div>
              <p className="text-gray-600 font-medium mb-2">
                拖拽文件到这里，或点击选择文件
              </p>
              <p className="text-sm text-gray-500">
                支持格式：TXT、PDF、DOC、DOCX（最大10MB）
              </p>
            </div>
          )}
        </div>

        {/* 文件拒绝提示 */}
        {fileRejections.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 font-medium mb-1">文件上传被拒绝：</p>
            <ul className="text-sm text-red-700 space-y-1">
              {fileRejections.map(({ file, errors }: any) => (
                <li key={file.name}>
                  <strong>{file.name}</strong>: {errors.map((e: any) => e.message).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 文件列表 */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                待上传文件 ({uploadFiles.length})
              </h4>
              <div className="flex items-center space-x-2">
                {completedFiles.length > 0 && (
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    ✓ {completedFiles.length} 完成
                  </Badge>
                )}
                {errorFiles.length > 0 && (
                  <Badge variant="destructive">
                    ✗ {errorFiles.length} 失败
                  </Badge>
                )}
                {pendingFiles.length > 0 && (
                  <Button
                    onClick={handleUploadAll}
                    disabled={isUploading}
                    size="sm"
                  >
                    {isUploading ? '上传中...' : `上传全部 (${pendingFiles.length})`}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(uploadFile.status)}
                      <div className="flex-1">
                        <Input
                          value={uploadFile.title}
                          onChange={(e) => updateFile(uploadFile.id, { title: e.target.value })}
                          className="text-sm h-8"
                          disabled={uploadFile.status !== 'pending'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadFile.file.name} ({(uploadFile.file.size / 1024).toFixed(1)}KB)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Select
                        value={uploadFile.documentType}
                        onValueChange={(value) => updateFile(uploadFile.id, { documentType: value })}
                        disabled={uploadFile.status !== 'pending'}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">通用</SelectItem>
                          <SelectItem value="tutorial">教程</SelectItem>
                          <SelectItem value="reference">参考</SelectItem>
                          <SelectItem value="assignment">作业</SelectItem>
                          <SelectItem value="manual">手册</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        disabled={uploadFile.status === 'uploading' || uploadFile.status === 'processing'}
                      >
                        ✗
                      </Button>
                    </div>
                  </div>

                  {/* 进度条 */}
                  {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                    <Progress value={uploadFile.progress} className="h-2" />
                  )}

                  {/* 状态信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{getStatusText(uploadFile.status)}</span>
                    {uploadFile.error && (
                      <span className="text-red-600">{uploadFile.error}</span>
                    )}
                    {uploadFile.result && (
                      <span className="text-green-600">
                        已处理，向量化: {uploadFile.result.embeddingGenerated ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}