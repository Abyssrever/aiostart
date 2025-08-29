import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')

    if (!userId) {
      return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 })
    }

    // 创建 Supabase 服务端客户端
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

    // 构建查询
    let query = supabase
      .from('file_attachments')
      .select('*')
      .eq('uploaded_by', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // 如果指定了类别，则过滤类别
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: files, error } = await query

    if (error) {
      console.error('数据库查询错误:', error)
      return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 })
    }

    // 转换为前端需要的格式
    const fileInfos = files.map((file: any) => ({
      id: file.id,
      name: file.original_name,
      originalName: file.original_name,
      fileName: file.stored_name,
      path: `/api/files/view/${file.id}`, // 新的API路径格式
      publicUrl: file.public_url,
      size: file.file_size,
      type: file.mime_type,
      category: file.category,
      uploadedAt: file.created_at,
      userId: file.uploaded_by,
      bucket: file.storage_bucket,
      storagePath: file.storage_path,
      accessLevel: file.access_level,
      description: file.description,
      tags: file.tags || []
    }))

    return NextResponse.json({
      success: true,
      files: fileInfos
    })

  } catch (error) {
    console.error('文件列表获取错误:', error)
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 })
  }
}