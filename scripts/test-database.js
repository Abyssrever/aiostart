/**
 * 简单的数据库测试脚本
 */

async function testDatabase() {
  console.log('🧪 测试数据库连接...')
  
  try {
    const response = await fetch('http://localhost:3000/api/okr?action=testConnection')
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ 数据库连接成功!')
      console.log('📊 数据库状态:')
      console.log('  - 连接状态:', result.connection.status)
      console.log('  - 所有表:', result.tables.all.join(', '))
      console.log('  - OKR表存在:', result.tables.okrs.exists)
      
      if (result.tables.okrs.exists && result.tables.okrs.columns) {
        console.log('  - OKR表字段:', result.tables.okrs.columns.map(c => c.column_name).join(', '))
      }
      
      if (result.recommendations.length > 0) {
        console.log('⚠️  建议:')
        result.recommendations.forEach(rec => console.log('  -', rec))
      }
    } else {
      console.error('❌ 数据库连接失败:', result.error)
      if (result.details) {
        console.error('   详情:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message)
    console.log('💡 提示: 请确保应用正在运行 (npm run dev)')
  }
}

if (require.main === module) {
  testDatabase()
}

module.exports = { testDatabase }