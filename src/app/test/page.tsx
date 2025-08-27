'use client'

export default function TestPage() {
  const checkEnvVars = () => {
    console.log('Environment variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">环境变量测试</h1>
      <button 
        onClick={checkEnvVars}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        检查环境变量
      </button>
      
      <div className="mt-4">
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置'}</p>
      </div>
    </div>
  )
}