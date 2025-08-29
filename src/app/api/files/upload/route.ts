import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const userId = data.get('userId') as string
    const category = data.get('category') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: '没有找到文件' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 })
    }

    // 检查文件大小 (10MB 限制)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 })
    }

    // 检查文件类型
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/json'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'uploads', userId, category)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成安全的文件名
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${sanitizedFileName}`
    const filePath = join(uploadDir, fileName)

    // 写入文件
    await writeFile(filePath, buffer)

    // 返回文件信息
    const fileInfo = {
      id: `${userId}_${timestamp}`,
      name: file.name,
      originalName: file.name,
      fileName: fileName,
      path: `/api/files/view/${userId}/${category}/${fileName}`,
      size: file.size,
      type: file.type,
      category,
      uploadedAt: new Date().toISOString(),
      userId
    }

    return NextResponse.json({
      success: true,
      file: fileInfo
    })

  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: '方法不允许' }, { status: 405 })
}