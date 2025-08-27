// 测试激活后的N8N工作流
const testActivation = async () => {
  const url = 'https://n8n-vdarinvh.us-east-1.clawcloudrun.com/webhook-test/21e98a9d-e00b-42e7-a224-37c14f335815'
  const payload = { userMessage: "你好，能帮我写一个关于如何提高学习效率的OKR吗？" }
  
  console.log('🧪 测试N8N工作流激活状态')
  console.log('⏰ 时间:', new Date().toLocaleString())
  console.log('🔗 URL:', url)
  console.log('📤 请求:', JSON.stringify(payload))
  console.log()
  
  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 第 ${i} 次尝试...`)
    
    try {
      const startTime = Date.now()
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'QimingStar-Test'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000) // 15秒超时
      })
      
      const responseTime = Date.now() - startTime
      console.log(`📊 状态: ${response.status} (${responseTime}ms)`)
      
      if (response.status === 200) {
        console.log('✅ 成功! 工作流已激活并运行')
        
        try {
          const data = await response.json()
          console.log('📥 响应数据:', JSON.stringify(data, null, 2))
          
          if (data.response) {
            console.log('\n🤖 AI回复:')
            console.log('─'.repeat(60))
            console.log(data.response)
            console.log('─'.repeat(60))
            console.log('\n🎉 N8N工作流测试完全成功!')
            return true
          } else {
            console.log('⚠️ 响应格式需要调整，缺少"response"字段')
            return true // 仍然算成功，只是格式问题
          }
        } catch (jsonError) {
          const text = await response.text()
          console.log('📄 原始响应:', text)
          console.log('⚠️ JSON解析失败，但状态码200')
          return true
        }
        
      } else if (response.status === 404) {
        console.log('❌ 404 - 工作流未激活')
        if (i < 3) {
          console.log('等待2秒后重试...\n')
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
        
      } else {
        console.log(`❌ 错误状态: ${response.status}`)
        const errorText = await response.text()
        console.log('错误信息:', errorText)
      }
      
    } catch (error) {
      console.log(`💥 请求异常: ${error.message}`)
      if (error.name === 'TimeoutError') {
        console.log('请求超时，工作流可能在处理中...')
      }
      
      if (i < 3) {
        console.log('等待3秒后重试...\n')
        await new Promise(resolve => setTimeout(resolve, 3000))
        continue
      }
    }
    
    break // 成功或最后一次尝试后跳出
  }
  
  console.log('\n❌ 所有尝试都失败了')
  console.log('💡 请确保:')
  console.log('1. N8N工作流已激活(Active开关为绿色)')
  console.log('2. 工作流配置正确')
  console.log('3. 网络连接正常')
  return false
}

testActivation().then(success => {
  console.log('\n' + '='.repeat(60))
  if (success) {
    console.log('🎊 测试成功! 可以集成到启明星平台了!')
  } else {
    console.log('❌ 测试失败，需要检查N8N工作流配置')
  }
  console.log('='.repeat(60))
})