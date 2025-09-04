import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // 应用速率限制
    const clientIP = getClientIP(request)
    const rateLimit = await applyRateLimit(clientIP, 'general')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ error: '文件ID不能为空' }, { status: 400 })
    }

    // 获取文件信息
    const { data: fileInfo, error: fileError } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !fileInfo) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 生成预览数据
    const previewData = {
      id: fileInfo.id,
      name: fileInfo.original_name,
      size: fileInfo.file_size,
      type: fileInfo.mime_type,
      uploadedAt: fileInfo.created_at,
      category: fileInfo.category,
      canPreview: canPreviewFile(fileInfo.mime_type),
      previewUrl: null as string | null,
      metadata: {
        bucket: fileInfo.storage_bucket,
        path: fileInfo.storage_path
      }
    }

    // 如果是可预览的文件类型，生成预览URL
    if (previewData.canPreview) {
      const { data: signedUrlData } = await supabase.storage
        .from(fileInfo.storage_bucket)
        .createSignedUrl(fileInfo.storage_path, 3600) // 1小时有效期

      if (signedUrlData?.signedUrl) {
        previewData.previewUrl = signedUrlData.signedUrl
      }
    }

    return NextResponse.json({
      success: true,
      file: previewData
    })

  } catch (error) {
    console.error('文件预览错误:', error)
    return NextResponse.json({ error: '获取文件预览失败' }, { status: 500 })
  }
}

// 判断文件是否可以预览
function canPreviewFile(mimeType: string): boolean {
  const previewableTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json'
  ]
  
  return previewableTypes.includes(mimeType) || mimeType.startsWith('text/')
}