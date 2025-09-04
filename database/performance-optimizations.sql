-- 数据库性能优化SQL
-- 为启明星平台提供更好的查询性能

-- ============================================
-- 1. 添加复合索引优化常用查询
-- ============================================

-- OKR相关查询优化
CREATE INDEX IF NOT EXISTS idx_okrs_user_status_year ON okrs(user_id, status, target_year);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_status ON key_results(okr_id, status);

-- 聊天记录查询优化
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated ON chat_sessions(user_id, updated_at DESC);

-- 学习活动查询优化
CREATE INDEX IF NOT EXISTS idx_learning_activities_user_type_date ON learning_activities(user_id, activity_type, created_at DESC);

-- 用户查询优化
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role_type, status);

-- ============================================
-- 2. 创建视图简化复杂查询
-- ============================================

-- 用户OKR汇总视图
CREATE OR REPLACE VIEW user_okr_summary AS
SELECT 
  u.id as user_id,
  u.name,
  u.role_type,
  COUNT(o.id) as total_okrs,
  COUNT(CASE WHEN o.status = 'active' THEN 1 END) as active_okrs,
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_okrs,
  AVG(o.progress_percentage) as avg_progress,
  COUNT(kr.id) as total_key_results,
  COUNT(CASE WHEN kr.status = 'completed' THEN 1 END) as completed_key_results
FROM users u
LEFT JOIN okrs o ON u.id = o.user_id
LEFT JOIN key_results kr ON o.id = kr.okr_id
WHERE u.status = 'active'
GROUP BY u.id, u.name, u.role_type;

-- 学习活动汇总视图
CREATE OR REPLACE VIEW user_learning_summary AS
SELECT 
  user_id,
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as activity_count,
  SUM(duration_minutes) as total_duration,
  AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score,
  COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) as completed_count
FROM learning_activities
GROUP BY user_id, DATE_TRUNC('week', created_at);

-- ============================================
-- 3. 创建优化的存储过程
-- ============================================

-- 获取用户完整OKR数据（优化版）
CREATE OR REPLACE FUNCTION get_user_okrs_optimized(user_uuid UUID)
RETURNS TABLE (
  okr_id UUID,
  okr_title TEXT,
  okr_description TEXT,
  okr_progress INTEGER,
  okr_status TEXT,
  key_results JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as okr_id,
    o.title as okr_title,
    o.description as okr_description,
    o.progress_percentage as okr_progress,
    o.status as okr_status,
    COALESCE(
      json_agg(
        json_build_object(
          'id', kr.id,
          'title', kr.title,
          'current_value', kr.current_value,
          'target_value', kr.target_value,
          'progress_percentage', kr.progress_percentage,
          'status', kr.status
        ) ORDER BY kr.created_at
      ) FILTER (WHERE kr.id IS NOT NULL),
      '[]'::json
    )::jsonb as key_results
  FROM okrs o
  LEFT JOIN key_results kr ON o.id = kr.okr_id
  WHERE o.user_id = user_uuid
  GROUP BY o.id, o.title, o.description, o.progress_percentage, o.status
  ORDER BY o.created_at DESC;
END;
$$;

-- 获取用户仪表盘数据（单次查询）
CREATE OR REPLACE FUNCTION get_user_dashboard(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_info', (
      SELECT json_build_object(
        'id', id,
        'name', name,
        'role_type', role_type,
        'grade', grade,
        'major', major
      )
      FROM users WHERE id = user_uuid
    ),
    'okr_stats', (
      SELECT json_build_object(
        'total_okrs', COUNT(o.id),
        'active_okrs', COUNT(CASE WHEN o.status = 'active' THEN 1 END),
        'avg_progress', COALESCE(AVG(o.progress_percentage), 0),
        'total_key_results', COUNT(kr.id),
        'completed_key_results', COUNT(CASE WHEN kr.status = 'completed' THEN 1 END)
      )
      FROM okrs o
      LEFT JOIN key_results kr ON o.id = kr.okr_id
      WHERE o.user_id = user_uuid
    ),
    'recent_activities', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'activity_type', activity_type,
          'completion_status', completion_status,
          'created_at', created_at
        ) ORDER BY created_at DESC
      ), '[]'::json)
      FROM learning_activities
      WHERE user_id = user_uuid
      LIMIT 5
    ),
    'recent_chats', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'session_type', session_type,
          'message_count', message_count,
          'last_message_at', last_message_at
        ) ORDER BY last_message_at DESC
      ), '[]'::json)
      FROM chat_sessions
      WHERE user_id = user_uuid AND status = 'active'
      LIMIT 3
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION get_user_okrs_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard TO authenticated;
GRANT SELECT ON user_okr_summary TO authenticated;
GRANT SELECT ON user_learning_summary TO authenticated;