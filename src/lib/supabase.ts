import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建浏览器端客户端
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// 创建服务端客户端（用于服务端渲染）
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// 数据库类型定义
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          student_id: string | null
          name: string
          email: string
          avatar_url: string | null
          grade: number | null
          major: string | null
          class_name: string | null
          phone: string | null
          wechat: string | null
          bio: string | null
          skills: any | null
          interests: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          name: string
          email: string
          avatar_url?: string | null
          grade?: number | null
          major?: string | null
          class_name?: string | null
          phone?: string | null
          wechat?: string | null
          bio?: string | null
          skills?: any | null
          interests?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          name?: string
          email?: string
          avatar_url?: string | null
          grade?: number | null
          major?: string | null
          class_name?: string | null
          phone?: string | null
          wechat?: string | null
          bio?: string | null
          skills?: any | null
          interests?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: any | null
          created_at: string
          updated_at: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_by: string | null
          assigned_at: string
        }
      }
    }
  }
}

// 用户角色类型
export type UserRole = 'student' | 'teacher' | 'admin'

// 用户信息类型
export type UserProfile = Database['public']['Tables']['users']['Row'] & {
  roles: UserRole[]
}