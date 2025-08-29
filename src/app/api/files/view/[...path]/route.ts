import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const path = resolvedParams.path
    
    // 这个路由现在期望接收文件ID而不是路径
    // URL格式: /api/files/view/{fileId}
    const fileId = path[0]
    
    if (!fileId) {
      return NextResponse.json({ error: '文件ID是必需的' }, { status: 400 })
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

    // 从数据库获取文件信息
    const { data: fileData, error: fileError } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('id', fileId)
      .eq('status', 'active')
      .single()

    if (fileError || !fileData) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 检查权限 (简化版本，实际应该基于用户权限)
    // TODO: 添加更详细的权限检查

    try {
      // 从 Supabase Storage 下载文件
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(fileData.storage_bucket)
        .download(fileData.storage_path)

      if (downloadError || !downloadData) {
        console.error('Supabase Storage 下载错误:', downloadError)
        return NextResponse.json({ error: '文件下载失败' }, { status: 500 })
      }

      // 将 Blob 转换为 ArrayBuffer
      const arrayBuffer = await downloadData.arrayBuffer()

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': fileData.mime_type || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${fileData.original_name}"`,
          'Cache-Control': 'private, max-age=3600', // 1小时缓存
          'Content-Length': fileData.file_size.toString(),
        },
      })

    } catch (storageError) {
      console.error('存储访问错误:', storageError)
      
      // 如果直接访问失败，尝试使用公共URL重定向
      if (fileData.public_url) {
        return NextResponse.redirect(fileData.public_url)
      }
      
      return NextResponse.json({ error: '文件访问失败' }, { status: 500 })
    }

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
    const fileId = path[0]
    
    if (!fileId) {
      return NextResponse.json({ error: '文件ID是必需的' }, { status: 400 })
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

    // 获取文件信息
    const { data: fileData, error: fileError } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('id', fileId)
      .eq('status', 'active')
      .single()

    if (fileError || !fileData) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // TODO: 添加权限检查，确保用户有删除权限

    // 从 Supabase Storage 删除文件
    const { error: storageError } = await supabase.storage
      .from(fileData.storage_bucket)
      .remove([fileData.storage_path])

    if (storageError) {
      console.error('Supabase Storage 删除错误:', storageError)
      // 即使存储删除失败，也继续删除数据库记录
    }

    // 软删除：将状态更新为 'deleted'
    const { error: dbError } = await supabase
      .from('file_attachments')
      .update({ status: 'deleted' })
      .eq('id', fileId)

    if (dbError) {
      console.error('数据库删除错误:', dbError)
      return NextResponse.json({ error: '文件删除失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '文件删除成功' })

  } catch (error) {
    console.error('文件删除错误:', error)
    return NextResponse.json({ error: '文件删除失败' }, { status: 500 })
  }
}