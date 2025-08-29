import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { extname } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const path = resolvedParams.path
    if (!path || path.length < 3) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 })
    }

    const [userId, category, fileName] = path
    const filePath = join(process.cwd(), 'uploads', userId, category, fileName)

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    const fileExt = extname(fileName).toLowerCase()

    // 根据文件扩展名设置正确的 Content-Type
    const contentTypeMap: { [key: string]: string } = {
      '.txt': 'text/plain; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.json': 'application/json'
    }

    const contentType = contentTypeMap[fileExt] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=31536000',
      },
    })

  } catch (error) {
    console.error('文件查看错误:', error)
    return NextResponse.json({ error: '文件读取失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const path = resolvedParams.path
    if (!path || path.length < 3) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 })
    }

    const [userId, category, fileName] = path
    const filePath = join(process.cwd(), 'uploads', userId, category, fileName)

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    const { unlink } = await import('fs/promises')
    await unlink(filePath)

    return NextResponse.json({ success: true, message: '文件删除成功' })

  } catch (error) {
    console.error('文件删除错误:', error)
    return NextResponse.json({ error: '文件删除失败' }, { status: 500 })
  }
}