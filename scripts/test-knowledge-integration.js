async function testKnowledgeIntegration() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 测试知识库集成功能...\n')
  
  const testUserId = '01935d50-dd66-750a-8000-16b8c8d25d24'
  
  // 测试知识库相关问题
  const testCases = [
    {
      name: '编程相关问题',
      message: 'JavaScript的闭包是什么？',
    },
    {
      name: '学习方法问题',
      message: '如何高效学习编程？',
    },
    {
      name: '算法问题',
      message: '什么是动态规划？',
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.name}`)
    console.log(`   问题: ${testCase.message}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testCase.message,
          userId: testUserId,
          sessionType: 'general'
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      console.log(`   ✅ API响应成功`)
      console.log(`   📚 知识库: ${result.knowledgeResults ? '已集成' : '未使用'}`)
      console.log(`   🤖 AI回复: ${result.content.substring(0, 150)}...`)
      console.log('')
      
    } catch (error) {
      console.error(`   ❌ 测试失败:`, error.message)
      console.log('')
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('✅ 知识库集成测试完成！')
}

testKnowledgeIntegration().catch(console.error)