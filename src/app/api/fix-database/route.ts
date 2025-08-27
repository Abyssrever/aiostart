import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('开始修复数据库结构...')
    
    // 检查并添加 ai_agent_type 列到 chat_sessions 表
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'chat_sessions' 
                AND column_name = 'ai_agent_type'
            ) THEN
                -- 添加 ai_agent_type 列
                ALTER TABLE chat_sessions 
                ADD COLUMN ai_agent_type VARCHAR(20) DEFAULT 'student' 
                CHECK (ai_agent_type IN ('student', 'teacher', 'college'));
                
                RAISE NOTICE 'Added ai_agent_type column to chat_sessions table';
            ELSE
                RAISE NOTICE 'ai_agent_type column already exists in chat_sessions table';
            END IF;
        END
        $$;
        
        -- 更新现有记录的默认值
        UPDATE chat_sessions 
        SET ai_agent_type = 'student' 
        WHERE ai_agent_type IS NULL;
      `
    })
    
    if (error) {
      console.error('修复数据库失败:', error)
      
      // 尝试直接执行 ALTER TABLE 命令
      const { error: alterError } = await supabase
        .from('chat_sessions')
        .select('id')
        .limit(1)
        
      if (alterError?.message?.includes("ai_agent_type")) {
        // 如果错误信息包含 ai_agent_type，说明列确实不存在
        // 直接执行原始SQL
        const { error: rawError } = await supabase
          .rpc('exec_raw_sql', {
            query: 'ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS ai_agent_type VARCHAR(20) DEFAULT \'student\' CHECK (ai_agent_type IN (\'student\', \'teacher\', \'college\'))'
          })
          
        if (rawError) {
          return NextResponse.json({ 
            error: '无法修复数据库结构', 
            details: rawError.message 
          }, { status: 500 })
        }
      }
    }
    
    // 验证修复结果
    const { data: testData, error: testError } = await supabase
      .from('chat_sessions')
      .select('ai_agent_type')
      .limit(1)
    
    if (testError) {
      return NextResponse.json({ 
        error: '验证修复结果失败', 
        details: testError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'chat_sessions 表结构修复成功',
      details: 'ai_agent_type 列已添加'
    })
    
  } catch (error) {
    console.error('修复数据库异常:', error)
    return NextResponse.json({ 
      error: '修复数据库异常', 
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}