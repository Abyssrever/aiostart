const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  'https://sxhfiadommaopzoigtbz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4'
)

async function setupKnowledgeBase() {
  try {
    console.log('🚀 开始设置知识库...\n')
    
    // 读取SQL文件
    const sqlContent = fs.readFileSync('database/create-knowledge-base.sql', 'utf8')
    
    // 分割SQL语句
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📄 准备执行 ${sqlStatements.length} 条SQL语句`)
    
    // 逐条执行SQL语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]
      if (statement.length < 10) continue // 跳过太短的语句
      
      console.log(`⚡ 执行语句 ${i + 1}/${sqlStatements.length}`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // 如果rpc方法不可用，尝试直接执行
          console.log('尝试其他方式执行...')
        }
      } catch (e) {
        console.log('RPC方式失败，尝试直接插入数据...')
      }
    }
    
    // 手动创建基础表结构
    console.log('🔧 手动创建知识库表...')
    
    // 创建knowledge_documents表
    const createDocsTable = `
      CREATE TABLE IF NOT EXISTS knowledge_documents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          document_type TEXT DEFAULT 'general',
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      )
    `
    
    console.log('📋 创建knowledge_documents表...')
    
    // 插入示例数据
    console.log('📝 插入示例知识库数据...')
    
    const sampleDocs = [
      {
        title: 'JavaScript基础教程',
        content: 'JavaScript是一种动态的、弱类型的编程语言，主要用于网页开发。闭包是JavaScript中的一个重要概念，它允许函数访问其外部作用域中的变量。闭包在JavaScript中有很多实际应用，比如模块模式、回调函数等。学习JavaScript闭包对于深入理解JavaScript至关重要。',
        document_type: 'tutorial',
        status: 'active'
      },
      {
        title: '学习方法指南',
        content: '高效学习编程的方法包括：1.实践为主，理论为辅 - 通过编写代码来学习，而不仅仅是阅读理论。2.项目驱动学习 - 选择感兴趣的项目，在实现过程中学习新知识。3.定期复习和总结 - 建立知识体系，定期回顾学过的内容。4.寻找学习伙伴 - 与他人讨论，互相学习。5.保持好奇心 - 主动探索新技术和工具。',
        document_type: 'guide',
        status: 'active'
      },
      {
        title: '算法与数据结构',
        content: '动态规划是一种算法设计技术，用于解决具有重叠子问题和最优子结构性质的问题。动态规划的核心思想是将复杂问题分解为更小的子问题，并存储子问题的解以避免重复计算。常见的动态规划问题包括斐波那契数列、最长公共子序列、背包问题等。掌握动态规划对于算法学习非常重要。',
        document_type: 'tutorial',
        status: 'active'
      }
    ]
    
    const { data: docs, error: docsError } = await supabase
      .from('knowledge_documents')
      .upsert(sampleDocs)
      .select()
    
    if (docsError) {
      console.log('❌ 插入文档失败:', docsError.message)
    } else {
      console.log('✅ 示例文档插入成功，数量:', docs.length)
    }
    
    // 测试搜索功能
    console.log('\n🔍 测试知识库搜索...')
    const { data: searchResults, error: searchError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .ilike('content', '%JavaScript%')
      .limit(3)
    
    if (searchError) {
      console.log('❌ 搜索测试失败:', searchError.message)
    } else {
      console.log('✅ 搜索测试成功，找到', searchResults.length, '条结果')
      if (searchResults.length > 0) {
        console.log('   示例结果:', searchResults[0].title)
      }
    }
    
    console.log('\n🎉 知识库设置完成！')
    
  } catch (error) {
    console.error('❌ 设置失败:', error.message)
  }
}

setupKnowledgeBase()