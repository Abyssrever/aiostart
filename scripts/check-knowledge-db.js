const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://sxhfiadommaopzoigtbz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4'
)

async function checkKnowledgeDB() {
  try {
    console.log('🔍 检查知识库数据库状态...\n')
    
    // 检查知识库表
    console.log('📊 检查knowledge_documents表...')
    const { data: docs, error: docsError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .limit(5)
    
    if (docsError) {
      console.log('❌ knowledge_documents表错误:', docsError.message)
    } else {
      console.log(`✅ knowledge_documents表正常，共${docs.length}条记录`)
      if (docs.length > 0) {
        console.log('   首条记录:', docs[0].title)
      }
    }
    
    // 检查知识块表
    console.log('\n📄 检查knowledge_chunks表...')
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('*')
      .limit(5)
    
    if (chunksError) {
      console.log('❌ knowledge_chunks表错误:', chunksError.message)
    } else {
      console.log(`✅ knowledge_chunks表正常，共${chunks.length}条记录`)
      if (chunks.length > 0) {
        console.log('   首条记录:', chunks[0].content.substring(0, 100) + '...')
      }
    }
    
    // 检查搜索函数
    console.log('\n🔎 测试search_knowledge函数...')
    const { data: searchResults, error: searchError } = await supabase.rpc('search_knowledge', {
      query_text: 'JavaScript编程',
      match_threshold: 0.5,
      match_count: 3
    })
    
    if (searchError) {
      console.log('❌ search_knowledge函数错误:', searchError.message)
      
      // 如果函数不存在，创建示例数据
      console.log('\n📝 创建示例知识库数据...')
      await createSampleKnowledge()
    } else {
      console.log(`✅ search_knowledge函数正常，返回${searchResults?.length || 0}条结果`)
      if (searchResults && searchResults.length > 0) {
        console.log('   搜索结果示例:', searchResults[0])
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

async function createSampleKnowledge() {
  try {
    // 创建示例知识文档
    const sampleDocs = [
      {
        title: 'JavaScript基础教程',
        content: 'JavaScript是一种动态的、弱类型的编程语言，主要用于网页开发。闭包是JavaScript中的一个重要概念。',
        document_type: 'tutorial',
        status: 'active'
      },
      {
        title: '学习方法指南',
        content: '高效学习编程的方法包括：1.实践为主，理论为辅 2.项目驱动学习 3.定期复习和总结',
        document_type: 'guide',
        status: 'active'
      }
    ]
    
    const { data: docs, error: docsError } = await supabase
      .from('knowledge_documents')
      .insert(sampleDocs)
      .select()
    
    if (docsError) {
      console.log('❌ 创建示例文档失败:', docsError.message)
      return
    }
    
    console.log('✅ 示例文档创建成功')
    
    // 创建知识块（如果有embedding字段的话）
    console.log('📝 尝试创建知识块...')
    
  } catch (error) {
    console.error('❌ 创建示例数据失败:', error.message)
  }
}

checkKnowledgeDB()