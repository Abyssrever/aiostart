import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 检测运行环境
    const isVercel = process.env.VERCEL === '1'
    
    if (isVercel) {
      // 生产环境：使用GitHub API获取提交记录
      return await getCommitsFromGitHub()
    } else {
      // 开发环境：使用本地git命令
      return await getCommitsFromLocal()
    }

  } catch (error: any) {
    console.error('获取Git提交记录失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Git仓库不可用或无提交记录',
      message: error.message || '未知错误'
    }, { status: 500 })
  }
}

// 从GitHub API获取提交记录（生产环境）
async function getCommitsFromGitHub() {
  try {
    const response = await fetch('https://api.github.com/repos/Abyssrever/aiostart/commits?per_page=20', {
      headers: {
        'User-Agent': 'qiming-star-app',
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    const githubCommits = await response.json()
    
    const commits = githubCommits.map((commit: any, index: number) => ({
      id: commit.sha.substring(0, 8),
      hash: commit.sha,
      message: commit.commit.message.split('\n')[0], // 只取第一行
      author: commit.commit.author.name,
      date: new Date(commit.commit.author.date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      refs: '', // GitHub API不直接提供refs信息
      version: `v1.0.${index + 1}`
    }))

    return NextResponse.json({
      success: true,
      data: commits,
      total: commits.length
    })
    
  } catch (error: any) {
    console.error('GitHub API获取失败:', error)
    
    // 回退到静态数据
    return getStaticCommits()
  }
}

// 从本地git获取提交记录（开发环境）
async function getCommitsFromLocal() {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  try {
    const { stdout } = await execAsync(
      'git log --oneline -20 --pretty=format:"%H|%s|%an|%ad|%d" --date=format:"%Y-%m-%d %H:%M:%S"',
      { 
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    )

    const commits = stdout
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string, index: number) => {
        const [hash, message, author, date, refs] = line.split('|')
        
        return {
          id: hash?.substring(0, 8) || '',
          hash: hash || '',
          message: message || '',
          author: author || '',
          date: date || '',
          refs: refs || '',
          version: `v1.0.${index + 1}`
        }
      })

    return NextResponse.json({
      success: true,
      data: commits,
      total: commits.length
    })
    
  } catch (error) {
    console.error('本地git命令失败:', error)
    return getStaticCommits()
  }
}

// 静态数据回退方案
function getStaticCommits() {
  const staticCommits = [
    {
      id: "799acee",
      hash: "799acee",
      message: "fix: 修复OKR创建时start_date NULL约束错误",
      author: "System",
      date: new Date().toLocaleDateString('zh-CN'),
      refs: "",
      version: "v1.0.1"
    },
    {
      id: "e192e79",
      hash: "e192e79", 
      message: "feat: 新增Git版本更新日志功能并修复显示问题",
      author: "System",
      date: new Date(Date.now() - 86400000).toLocaleDateString('zh-CN'),
      refs: "",
      version: "v1.0.2"
    },
    {
      id: "7e4ad4f",
      hash: "7e4ad4f",
      message: "fix: 修复TypeScript类型错误并统一OKR类型定义", 
      author: "System",
      date: new Date(Date.now() - 172800000).toLocaleDateString('zh-CN'),
      refs: "",
      version: "v1.0.3"
    }
  ]

  return NextResponse.json({
    success: true,
    data: staticCommits,
    total: staticCommits.length
  })
}