#!/usr/bin/env node

/**
 * Dify AI服务测试脚本
 * 用于验证Dify API集成是否正常工作
 */

const https = require('https')
const http = require('http')

// 配置信息
const DIFY_CONFIG = {
  baseUrl: 'https://dify.aipfuture.com/v1',
  apiKey: 'app-kCJGgAvqqvbfJV1AJ95HIYMz',
  appId: 'app-kCJGgAvqqvbfJV1AJ95HIYMz'
}

// 测试消息
const TEST_MESSAGE = '你好，我是启明星教育平台的学生，请介绍一下你的功能'

console.log('🧪 开始测试Dify API集成...')
console.log('📋 配置信息:')
console.log(`   Base URL: ${DIFY_CONFIG.baseUrl}`)
console.log(`   App ID: ${DIFY_CONFIG.appId}`)
console.log(`   API Key: ${DIFY_CONFIG.apiKey.substring(0, 10)}...`)
console.log('')

// 构建请求数据
const requestData = JSON.stringify({
  inputs: {
    user_name: '测试用户',
    user_role: 'student',
    session_type: 'general',
    system_prompt: '你是启明星教育平台的AI助手，专注于为学生提供学习指导和生活建议。请用友好、专业的语气回答问题。'
  },
  query: TEST_MESSAGE,
  response_mode: 'blocking',
  user: 'test-user-' + Date.now(),
  auto_generate_name: false
})

// 解析URL
const url = new URL(`${DIFY_CONFIG.baseUrl}/chat-messages`)
const isHttps = url.protocol === 'https:'

// 请求选项
const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
    'User-Agent': 'QimingStar-Platform-Test/1.0',
    'Content-Length': Buffer.byteLength(requestData)
  },
  timeout: 30000
}

console.log('📤 发送请求到Dify API...')
console.log(`   URL: ${url.toString()}`)
console.log(`   Method: ${options.method}`)
console.log(`   Message: ${TEST_MESSAGE}`)
console.log('')

const startTime = Date.now()

// 发送请求
const req = (isHttps ? https : http).request(options, (res) => {
  const responseTime = Date.now() - startTime
  
  console.log(`📊 响应状态: ${res.statusCode} ${res.statusMessage}`)
  console.log(`⏱️  响应时间: ${responseTime}ms`)
  console.log('📥 响应头:')
  Object.entries(res.headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`)
  })
  console.log('')

  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const response = JSON.parse(data)
        
        console.log('✅ Dify API调用成功!')
        console.log('')
        console.log('🤖 AI回复:')
        console.log('─'.repeat(50))
        console.log(response.answer || response.message || '无回复内容')
        console.log('─'.repeat(50))
        console.log('')
        
        if (response.metadata) {
          console.log('📊 响应统计:')
          if (response.metadata.usage) {
            console.log(`   Token使用: ${response.metadata.usage.total_tokens || 0}`)
            console.log(`   输入Token: ${response.metadata.usage.prompt_tokens || 0}`)
            console.log(`   输出Token: ${response.metadata.usage.completion_tokens || 0}`)
          }
          
          if (response.conversation_id) {
            console.log(`   会话ID: ${response.conversation_id}`)
          }
          
          if (response.message_id) {
            console.log(`   消息ID: ${response.message_id}`)
          }
          
          if (response.metadata.retriever_resources && response.metadata.retriever_resources.length > 0) {
            console.log(`   知识库检索: ${response.metadata.retriever_resources.length} 条结果`)
            response.metadata.retriever_resources.forEach((resource, index) => {
              console.log(`     ${index + 1}. ${resource.document_name} (相关度: ${(resource.score * 100).toFixed(1)}%)`)
            })
          }
        }
        
        console.log('')
        console.log('🎉 测试完成 - Dify集成正常工作!')
        
      } else {
        console.log('❌ Dify API调用失败!')
        console.log(`   状态码: ${res.statusCode}`)
        console.log(`   错误信息: ${data}`)
        
        try {
          const errorResponse = JSON.parse(data)
          if (errorResponse.message) {
            console.log(`   详细错误: ${errorResponse.message}`)
          }
        } catch (e) {
          // 忽略JSON解析错误
        }
      }
      
    } catch (error) {
      console.log('❌ 响应解析失败!')
      console.log(`   错误: ${error.message}`)
      console.log(`   原始响应: ${data}`)
    }
  })
})

req.on('error', (error) => {
  console.log('❌ 请求失败!')
  console.log(`   错误: ${error.message}`)
  
  if (error.code === 'ENOTFOUND') {
    console.log('   可能的原因: DNS解析失败，请检查网络连接')
  } else if (error.code === 'ECONNREFUSED') {
    console.log('   可能的原因: 连接被拒绝，请检查URL和端口')
  } else if (error.code === 'ETIMEDOUT') {
    console.log('   可能的原因: 请求超时，请检查网络连接')
  }
})

req.on('timeout', () => {
  console.log('❌ 请求超时!')
  req.destroy()
})

// 发送请求数据
req.write(requestData)
req.end()

console.log('⏳ 等待Dify API响应...')