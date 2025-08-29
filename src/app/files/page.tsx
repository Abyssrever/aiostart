'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import FileManager from '@/components/FileManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, Download, Database } from 'lucide-react'

export default function FilesPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <ProtectedRoute>
        <div>Loading...</div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">文件管理中心</h1>
            <p className="text-gray-600">管理您的所有文件和文档</p>
          </div>
        </div>

        {/* 快速统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                全部文件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">--</p>
              <p className="text-xs text-gray-500">总数量</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                本周上传
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">--</p>
              <p className="text-xs text-gray-500">新文件</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                存储使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">--</p>
              <p className="text-xs text-gray-500">MB / 1GB</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                热门类型
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">PDF</p>
              <p className="text-xs text-gray-500">最常用格式</p>
            </CardContent>
          </Card>
        </div>

        {/* 文件管理器 */}
        <FileManager
          allowUpload={true}
          className="w-full"
        />
      </div>
    </ProtectedRoute>
  )
}