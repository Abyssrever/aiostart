import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建浏览器端客户端
export const supabase = typeof window !== 'undefined' 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 创建开发环境专用客户端（绕过RLS）
// 注意：在生产环境中不应该在客户端暴露service role key
const serviceRoleKey = process.env.NODE_ENV === 'development' 
  ? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  : null
export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // 如果没有service key，回退到普通客户端

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
          username: string | null
          email: string
          password_hash: string | null
          full_name: string | null
          name: string
          avatar_url: string | null
          phone: string | null
          role_type: 'student' | 'teacher' | 'admin'
          grade: string | null
          major: string | null
          department: string | null
          class_name: string | null
          role: 'student' | 'teacher' | 'admin'
          status: 'active' | 'inactive' | 'suspended'
          email_verified: boolean
          verification_token: string | null
          token_expires_at: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          username?: string | null
          email: string
          password_hash?: string | null
          full_name?: string | null
          name: string
          avatar_url?: string | null
          phone?: string | null
          role_type?: 'student' | 'teacher' | 'admin'
          grade?: string | null
          major?: string | null
          department?: string | null
          class_name?: string | null
          role?: 'student' | 'teacher' | 'admin'
          status?: 'active' | 'inactive' | 'suspended'
          email_verified?: boolean
          verification_token?: string | null
          token_expires_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          username?: string | null
          email?: string
          password_hash?: string | null
          full_name?: string | null
          name?: string
          avatar_url?: string | null
          phone?: string | null
          role_type?: 'student' | 'teacher' | 'admin'
          grade?: string | null
          major?: string | null
          department?: string | null
          class_name?: string | null
          role?: 'student' | 'teacher' | 'admin'
          status?: 'active' | 'inactive' | 'suspended'
          email_verified?: boolean
          verification_token?: string | null
          token_expires_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      okrs: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          objective_type: 'personal' | 'course' | 'college'
          parent_okr_id: string | null
          target_quarter: string | null
          target_year: number
          status: 'draft' | 'active' | 'completed' | 'cancelled'
          progress_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          objective_type?: 'personal' | 'course' | 'college'
          parent_okr_id?: string | null
          target_quarter?: string | null
          target_year?: number
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          objective_type?: 'personal' | 'course' | 'college'
          parent_okr_id?: string | null
          target_quarter?: string | null
          target_year?: number
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      key_results: {
        Row: {
          id: string
          okr_id: string
          title: string
          description: string | null
          target_value: number | null
          current_value: number
          unit: string | null
          measurement_type: 'numeric' | 'boolean' | 'percentage'
          status: 'active' | 'completed' | 'at_risk' | 'blocked'
          progress_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          okr_id: string
          title: string
          description?: string | null
          target_value?: number | null
          current_value?: number
          unit?: string | null
          measurement_type?: 'numeric' | 'boolean' | 'percentage'
          status?: 'active' | 'completed' | 'at_risk' | 'blocked'
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          okr_id?: string
          title?: string
          description?: string | null
          target_value?: number | null
          current_value?: number
          unit?: string | null
          measurement_type?: 'numeric' | 'boolean' | 'percentage'
          status?: 'active' | 'completed' | 'at_risk' | 'blocked'
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      learning_activities: {
        Row: {
          id: string
          user_id: string
          activity_type: 'study' | 'project' | 'assignment' | 'exam' | 'discussion' | 'reading'
          title: string
          description: string | null
          course_id: string | null
          duration_minutes: number | null
          difficulty_level: number | null
          completion_status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
          score: number | null
          feedback: string | null
          tags: any[] | null
          metadata: any | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          session_type: 'general' | 'okr_planning' | 'study_help' | 'career_guidance'
          ai_agent_type: 'student' | 'teacher' | 'college'
          status: 'active' | 'archived' | 'deleted'
          last_message_at: string | null
          message_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          session_type?: 'general' | 'okr_planning' | 'study_help' | 'career_guidance'
          ai_agent_type?: 'student' | 'teacher' | 'college'
          status?: 'active' | 'archived' | 'deleted'
          last_message_at?: string | null
          message_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          message_type: 'user' | 'assistant' | 'system' | null
          content: string
          metadata: any | null
          tokens_used: number | null
          response_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string
          role: 'user' | 'assistant' | 'system'
          message_type?: 'user' | 'assistant' | 'system' | null
          content: string
          metadata?: any | null
          tokens_used?: number | null
          response_time_ms?: number | null
          created_at?: string
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
      email_verification_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
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