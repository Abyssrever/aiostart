#!/usr/bin/env node

/**
 * 启明星项目 - N8N AI聊天历史工作流测试脚本
 * 支持多轮对话并验证数据库存储
 * 匹配项目的实际数据库结构和用户系统
 */

const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// 配置
const config = {
  // N8N工作流webhook URL（从项目提供的工作流配置）
  n8nWebhookUrl: 'https://n8n-vdarinvh.us-east-1.clawcloudrun.com/webhook/f956c56f-90db-4b7e-8b6a-2cd1ec1342c9',
  
  // Supabase配置（从项目环境变量读取）
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // 测试用户配置（匹配项目的mockData）
  testUsers: {
    student: {
      userId: 'aca8db7a-5d38-4f21-8c4b-2d63a5e6f8b2', // 学生用户UUID
      userName: '张三',
      role: 'student',
      projectId: null, // 初始不指定项目
      organizationId: null, // 初始不指定组织
    },
    teacher: {
      userId: 'b7c9e8f1-2d4a-4b6c-8a1e-3f5d7c9e8f12',
      userName: '李老师', 
      role: 'teacher',
      projectId: '550e8400-e29b-41d4-a716-446655440020',
      organizationId: '550e8400-e29b-41d4-a716-446655440010',
    },
    admin: {
      userId: 'c8d9f0a2-3e5b-4c7d-9b2f-4a6e8d0c9f23',
      userName: '王管理员',
      role: 'admin',
      projectId: '550e8400-e29b-41d4-a716-446655440020',
      organizationId: '550e8400-e29b-41d4-a716-446655440010',
    }
  },
  
  // 请求超时时间
  timeout: 90000, // 90秒（AI处理需要更多时间）
};

// 初始化Supabase客户端
let supabase = null;
if (config.supabaseUrl && config.supabaseServiceKey) {
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    console.log('✅ Supabase客户端初始化成功');
  } catch (error) {
    console.log('⚠️ Supabase客户端初始化失败，将跳过数据库验证:', error.message);
  }
}

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 聊天历史记录
let conversationHistory = [];

/**
 * 调用N8N工作流
 * @param {string} chatInput 用户输入的聊天内容
 * @param {object} options 可选参数
 */
async function callN8NWorkflow(chatInput, options = {}) {
  const payload = {
    chatInput,
    userId: options.userId || config.testUser.userId,
    user_id: options.userId || config.testUser.userId, // 工作流中使用的字段
    project_id: options.projectId || config.testUser.projectId || null,
    organization_id: options.organizationId || config.testUser.organizationId || null,
  };

  console.log('\n🚀 发送请求到N8N工作流...');
  console.log('📤 请求参数:', JSON.stringify(payload, null, 2));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(config.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ N8N工作流响应成功');
    console.log('📥 响应内容:', JSON.stringify(result, null, 2));

    // 记录到对话历史
    conversationHistory.push({
      timestamp: new Date().toISOString(),
      user: chatInput,
      ai: result.output || result.content || '无响应内容',
      payload,
      response: result
    });

    return result;
  } catch (error) {
    console.error('❌ N8N工作流调用失败:', error.message);
    
    if (error.name === 'AbortError') {
      console.error('⏱️ 请求超时，可能工作流处理时间较长');
    }
    
    return null;
  }
}

/**
 * 验证聊天历史是否正确存储到数据库
 */
async function verifyChatHistory() {
  if (!supabase) {
    console.log('⚠️ 跳过数据库验证（Supabase未配置）');
    return;
  }

  try {
    console.log('\n🔍 验证聊天历史数据库存储...');
    
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', config.testUser.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ 数据库查询失败:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ 找到聊天历史记录:', data.length, '条');
      console.log('📊 最新记录:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ 未找到聊天历史记录');
    }
  } catch (error) {
    console.error('❌ 数据库验证失败:', error.message);
  }
}

/**
 * 显示对话历史摘要
 */
function showConversationSummary() {
  if (conversationHistory.length === 0) {
    console.log('\n📝 暂无对话历史');
    return;
  }

  console.log(`\n📝 对话历史摘要 (${conversationHistory.length} 轮对话):`);
  console.log('=' .repeat(60));
  
  conversationHistory.forEach((entry, index) => {
    console.log(`\n第${index + 1}轮对话 (${entry.timestamp}):`);
    console.log(`👤 用户: ${entry.user}`);
    console.log(`🤖 AI: ${entry.ai.length > 200 ? entry.ai.substring(0, 200) + '...' : entry.ai}`);
  });
  
  console.log('=' .repeat(60));
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
📖 可用命令：
  - 直接输入消息：发送到AI进行对话
  - /help : 显示帮助信息
  - /history : 显示对话历史
  - /verify : 验证数据库存储
  - /config : 显示当前配置
  - /clear : 清空对话历史
  - /exit : 退出程序
`);
}

/**
 * 显示当前配置
 */
function showConfig() {
  console.log('\n⚙️ 当前配置:');
  console.log(`- Webhook URL: ${config.n8nWebhookUrl}`);
  console.log(`- 测试用户ID: ${config.testUser.userId}`);
  console.log(`- 测试项目ID: ${config.testUser.projectId || '未设置'}`);
  console.log(`- 测试组织ID: ${config.testUser.organizationId || '未设置'}`);
  console.log(`- Supabase状态: ${supabase ? '已连接' : '未连接'}`);
  console.log(`- 请求超时: ${config.timeout}ms`);
}

/**
 * 主程序
 */
async function main() {
  console.log('🎯 N8N AI聊天历史工作流测试程序');
  console.log('=' .repeat(50));
  
  showConfig();
  showHelp();
  
  console.log('\n💬 开始对话测试 (输入 /help 查看命令):');

  const askQuestion = () => {
    rl.question('\n👤 您: ', async (input) => {
      const command = input.trim();

      if (command === '/exit') {
        console.log('\n👋 再见！');
        showConversationSummary();
        rl.close();
        return;
      }

      if (command === '/help') {
        showHelp();
        askQuestion();
        return;
      }

      if (command === '/history') {
        showConversationSummary();
        askQuestion();
        return;
      }

      if (command === '/verify') {
        await verifyChatHistory();
        askQuestion();
        return;
      }

      if (command === '/config') {
        showConfig();
        askQuestion();
        return;
      }

      if (command === '/clear') {
        conversationHistory = [];
        console.log('✅ 对话历史已清空');
        askQuestion();
        return;
      }

      if (!command) {
        console.log('⚠️ 请输入消息或命令');
        askQuestion();
        return;
      }

      // 发送消息到N8N工作流
      const result = await callN8NWorkflow(command);
      
      if (result) {
        const aiResponse = result.output || result.content || '无响应内容';
        console.log(`\n🤖 AI: ${aiResponse}`);
        
        // 延迟一下再验证数据库，让N8N有时间存储数据
        setTimeout(async () => {
          await verifyChatHistory();
        }, 2000);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n\n🛑 程序被中断');
  showConversationSummary();
  rl.close();
  process.exit(0);
});

// 启动程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  callN8NWorkflow,
  verifyChatHistory,
  config
};