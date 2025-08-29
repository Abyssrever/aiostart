import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// 获取存储桶名称的辅助函数
function getStorageBucket(category: string): string {
  switch (category) {
    case 'profile': return 'user-files'
    case 'chat': return 'chat-files'
    case 'okr': return 'okr-files'
    case 'assignment': return 'assignment-files'
    default: return 'user-files'
  }
}

export async function POST(request: NextRequest) {
  try {
    // 创建 Supabase 服务端客户端（使用 Service Role Key）
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

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const userId = data.get('userId') as string
    const category = data.get('category') as string || 'general'
    const chatSessionId = data.get('chatSessionId') as string
    const okrId = data.get('okrId') as string
    const keyResultId = data.get('keyResultId') as string

    if (!file) {
      return NextResponse.json({ error: '没有找到文件' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 })
    }

    // 检查文件大小 (根据类别设置不同限制)
    const maxSize = category === 'assignment' ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 作业50MB，其他10MB
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return NextResponse.json({ error: `文件大小不能超过${maxSizeMB}MB` }, { status: 400 })
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
      'image/webp',
      'application/json'
    ]

    if (category === 'assignment') {
      allowedTypes.push('application/zip', 'application/x-zip-compressed')
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
    }

    // 获取存储桶
    const bucket = getStorageBucket(category)
    
    // 生成文件路径 (userId/timestamp_filename)
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${userId}/${timestamp}_${sanitizedFileName}`

    // 将文件转换为 ArrayBuffer
    const fileBuffer = await file.arrayBuffer()

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        duplex: 'half'
      })

    if (uploadError) {
      console.error('Supabase Storage 上传错误:', uploadError)
      return NextResponse.json({ error: `文件上传失败: ${uploadError.message}` }, { status: 500 })
    }

    // 获取公共URL (如果需要)
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath)

    // 保存文件信息到数据库
    const fileRecord = {
      original_name: file.name,
      stored_name: `${timestamp}_${sanitizedFileName}`,
      storage_bucket: bucket,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
      category: category,
      chat_session_id: chatSessionId || null,
      okr_id: okrId || null,
      key_result_id: keyResultId || null,
      status: 'active',
      access_level: 'private',
      processing_status: 'completed'
    }

    // 插入文件记录到数据库
    const { data: dbData, error: dbError } = await supabase
      .from('file_attachments')
      .insert([fileRecord])
      .select()
      .single()

    if (dbError) {
      console.error('数据库插入错误:', dbError)
      // 如果数据库插入失败，删除已上传的文件
      await supabase.storage.from(bucket).remove([storagePath])
      return NextResponse.json({ error: '文件信息保存失败' }, { status: 500 })
    }

    // 返回文件信息
    const fileInfo = {
      id: dbData.id,
      name: file.name,
      originalName: file.name,
      fileName: dbData.stored_name,
      path: urlData.publicUrl,
      size: file.size,
      type: file.type,
      category,
      uploadedAt: dbData.created_at,
      userId,
      bucket,
      storagePath
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