import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的环境变量',
        variables: {
          NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY: !!serviceKey
        }
      })
    }
    
    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // 测试数据库连接
    const { data, error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (dbError) {
      return NextResponse.json({
        success: false,
        error: '数据库连接失败',
        dbError: dbError.message
      })
    }
    
    // 测试存储桶
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      return NextResponse.json({
        success: false,
        error: '存储服务连接失败',
        storageError: storageError.message
      })
    }
    
    // 检查必要的存储桶是否存在
    const requiredBuckets = ['user-files', 'chat-files', 'okr-files', 'assignment-files']
    const existingBuckets = buckets?.map(b => b.name) || []
    const missingBuckets = requiredBuckets.filter(bucket => !existingBuckets.includes(bucket))
    
    // 检查 file_attachments 表是否存在
    const { data: tableData, error: tableError } = await supabase
      .from('file_attachments')
      .select('id')
      .limit(1)
    
    return NextResponse.json({
      success: true,
      message: '连接测试完成',
      database: {
        connected: !dbError,
        userTableExists: !dbError,
        fileTableExists: !tableError,
        tableError: tableError?.message
      },
      storage: {
        connected: !storageError,
        existingBuckets,
        missingBuckets,
        allBucketsExist: missingBuckets.length === 0
      },
      environment: {
        supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
        hasServiceKey: !!serviceKey
      }
    })
    
  } catch (error) {
    console.error('测试错误:', error)
    return NextResponse.json({
      success: false,
      error: '测试过程中发生错误',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}