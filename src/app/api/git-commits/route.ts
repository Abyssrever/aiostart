import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // 获取最近20次提交记录
    const { stdout } = await execAsync(
      'git log --oneline -20 --pretty=format:"%H|%s|%an|%ad|%d" --date=format:"%Y-%m-%d %H:%M:%S"',
      { 
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    )

    const commits = stdout
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => {
        const [hash, message, author, date, refs] = line.split('|')
        
        // 生成版本号：v1.0.{index+1}，最新的提交获得最高版本号
        const versionNumber = `v1.0.${index + 1}`
        
        return {
          id: hash?.substring(0, 8) || '',
          hash: hash || '',
          message: message || '',
          author: author || '',
          date: date || '',
          refs: refs || '',
          version: versionNumber
        }
      })
      // git log默认已经按时间倒序排列（最新在前），无需再反转

    return NextResponse.json({
      success: true,
      data: commits,
      total: commits.length
    })

  } catch (error: any) {
    console.error('获取Git提交记录失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Git仓库不可用或无提交记录',
      message: error.message || '未知错误'
    }, { status: 500 })
  }
}