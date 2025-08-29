'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, File, FileText, FileImage, FileVideo, FileAudio } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface FileUploadProps {
  category?: 'general' | 'chat' | 'okr' | 'assignment' | 'profile' | 'document'
  maxSize?: number // MB
  allowedTypes?: string[]
  multiple?: boolean
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
  chatSessionId?: string
  okrId?: string
  keyResultId?: string
  className?: string
}

interface UploadedFile {
  id: string
  name: string
  originalName: string
  path: string
  size: number
  type: string
  category: string
  uploadedAt: string
}

interface FileWithProgress {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  result?: UploadedFile
}

const FileUpload: React.FC<FileUploadProps> = ({
  category = 'general',
  maxSize = 10,
  allowedTypes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/json'
  ],
  multiple = true,
  onUploadComplete,
  onUploadError,
  chatSessionId,
  okrId,
  keyResultId,
  className = ''
}) => {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4" />
    if (mimeType.startsWith('video/')) return <FileVideo className="w-4 h-4" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-4 h-4" />
    if (mimeType === 'application/pdf' || mimeType.includes('document')) {
      return <FileText className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}`
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小超过限制: ${formatFileSize(file.size)} (最大 ${maxSize}MB)`
    }
    return null
  }

  const uploadFile = async (fileWithProgress: FileWithProgress) => {
    if (!user) {
      throw new Error('用户未登录')
    }

    const formData = new FormData()
    formData.append('file', fileWithProgress.file)
    formData.append('userId', user.id)
    formData.append('category', category)
    
    if (chatSessionId) formData.append('chatSessionId', chatSessionId)
    if (okrId) formData.append('okrId', okrId)
    if (keyResultId) formData.append('keyResultId', keyResultId)

    const xhr = new XMLHttpRequest()

    return new Promise<UploadedFile>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setFiles(prev => prev.map(f => 
            f.file === fileWithProgress.file 
              ? { ...f, progress }
              : f
          ))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              resolve(response.file)
            } else {
              reject(new Error(response.error || '上传失败'))
            }
          } catch (error) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'))
      })

      xhr.open('POST', '/api/files/upload')
      xhr.send(formData)
    })
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    if (!user) {
      onUploadError?.('请先登录')
      return
    }

    const newFiles: FileWithProgress[] = Array.from(fileList).map(file => {
      const error = validateFile(file)
      return {
        file,
        progress: 0,
        status: error ? 'error' as const : 'uploading' as const,
        error: error || undefined
      }
    })

    setFiles(prev => [...prev, ...newFiles])

    const validFiles = newFiles.filter(f => f.status === 'uploading')
    const uploadedFiles: UploadedFile[] = []

    for (const fileWithProgress of validFiles) {
      try {
        const result = await uploadFile(fileWithProgress)
        
        setFiles(prev => prev.map(f => 
          f.file === fileWithProgress.file 
            ? { ...f, status: 'completed' as const, progress: 100, result }
            : f
        ))
        
        uploadedFiles.push(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败'
        
        setFiles(prev => prev.map(f => 
          f.file === fileWithProgress.file 
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        ))
        
        onUploadError?.(errorMessage)
      }
    }

    if (uploadedFiles.length > 0) {
      onUploadComplete?.(uploadedFiles)
    }
  }, [user, category, maxSize, allowedTypes, chatSessionId, okrId, keyResultId, onUploadComplete, onUploadError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = useCallback((fileToRemove: FileWithProgress) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove.file))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  return (
    <div className={className}>
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                拖拽文件到这里，或者
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                选择文件
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              支持: PDF, Word, Excel, 图片, 文本文件等
              <br />
              最大文件大小: {maxSize}MB
            </p>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">上传文件 ({files.length})</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs text-gray-500"
            >
              清空
            </Button>
          </div>
          
          {files.map((fileWithProgress, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getFileIcon(fileWithProgress.file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileWithProgress.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileWithProgress.file.size)}
                  </p>
                  
                  {fileWithProgress.status === 'uploading' && (
                    <Progress 
                      value={fileWithProgress.progress} 
                      className="w-full h-1 mt-1" 
                    />
                  )}
                  
                  {fileWithProgress.status === 'error' && (
                    <Alert variant="destructive" className="mt-1 p-2">
                      <AlertDescription className="text-xs">
                        {fileWithProgress.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {fileWithProgress.status === 'completed' && (
                    <span className="text-green-600 text-xs">✓</span>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileWithProgress)}
                    className="p-1 h-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload