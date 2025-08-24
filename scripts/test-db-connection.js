// 简单的数据库连接测试
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDAzMDcsImV4cCI6MjA3MTMxNjMwN30.XuGU_SfH185ZVSqZwEtPaIPZv_nPnNHRtJPzkWnVgBc'

async function testDBConnection() {
  console.log('🔍 测试数据库连接...')
  
  try {
    // 测试基本连接
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ Supabase API连接成功')
    } else {
      console.log('❌ Supabase API连接失败:', response.status)
      return
    }

    // 测试表访问
    const tables = ['users', 'okrs', 'key_results', 'chat_sessions', 'chat_messages']
    
    for (const table of tables) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          console.log(`✅ 表 ${table} 可访问`)
        } else {
          console.log(`❌ 表 ${table} 访问失败:`, response.status)
        }
      } catch (error) {
        console.log(`❌ 表 ${table} 测试异常:`, error.message)
      }
    }
    
    console.log('\n🎉 数据库连接测试完成!')
    
  } catch (error) {
    console.error('💥 测试异常:', error)
  }
}

testDBConnection()