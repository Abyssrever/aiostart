// 使用Node.js内置的fetch API（Node.js 18+）

async function testAIOKRIntegration() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 测试AI-OKR集成功能...\n')
  
  // 测试用户ID（从之前的简单OKR创建脚本中获取）
  const testUserId = '01935d50-dd66-750a-8000-16b8c8d25d24'
  
  // 测试案例
  const testCases = [
    {
      name: '创建OKR测试',
      message: '我想制定本学期提升编程能力的学习目标，包括完成3个项目和学习100小时',
      expectedAction: 'create'
    },
    {
      name: '更新进度测试', 
      message: '我完成了2个编程项目，Java学习进度到了60%',
      expectedAction: 'update'
    },
    {
      name: '查询状态测试',
      message: '我的学习目标进度怎么样？',
      expectedAction: 'query'
    },
    {
      name: '普通聊天测试',
      message: '你好，今天天气不错',
      expectedAction: 'none'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.name}`)
    console.log(`   消息: ${testCase.message}`)
    
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
      console.log(`   📊 OKR相关: ${result.okrResult ? '是' : '否'}`)
      
      if (result.okrResult) {
        console.log(`   🎯 OKR操作: ${result.okrResult.success ? '成功' : '失败'}`)
        console.log(`   💬 OKR消息: ${result.okrResult.message || '无'}`)
      }
      
      console.log(`   🤖 AI回复: ${result.content.substring(0, 100)}...`)
      console.log('')
      
    } catch (error) {
      console.error(`   ❌ 测试失败:`, error.message)
      console.log('')
    }
    
    // 等待1秒避免速率限制
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('✅ AI-OKR集成测试完成！')
}

// 执行测试
testAIOKRIntegration().catch(console.error)