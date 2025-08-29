import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category') || 'general'

    if (!userId) {
      return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'uploads', userId, category)
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json({ success: true, files: [] })
    }

    const files = await readdir(uploadDir)
    const fileInfos = await Promise.all(
      files.map(async (fileName) => {
        const filePath = join(uploadDir, fileName)
        const stats = await stat(filePath)
        
        // 从文件名解析时间戳和原始名称
        const parts = fileName.split('_')
        const timestamp = parts[0]
        const originalName = parts.slice(1).join('_')
        
        return {
          id: `${userId}_${timestamp}`,
          name: originalName,
          fileName: fileName,
          path: `/api/files/view/${userId}/${category}/${fileName}`,
          size: stats.size,
          category,
          uploadedAt: new Date(parseInt(timestamp)).toISOString(),
          userId,
          // 根据文件扩展名判断类型
          type: getFileType(fileName)
        }
      })
    )

    // 按上传时间倒序排列
    fileInfos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json({
      success: true,
      files: fileInfos
    })

  } catch (error) {
    console.error('文件列表获取错误:', error)
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 })
  }
}

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  const typeMap: { [key: string]: string } = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'json': 'application/json'
  }
  
  return typeMap[ext || ''] || 'application/octet-stream'
}