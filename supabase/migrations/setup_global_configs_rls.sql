-- =====================================================
-- global_configs 表的行级安全（RLS）策略
-- =====================================================
-- 说明：global_configs 存储全局配置，所有认证用户可以读取，
--       但只有管理员可以修改（目前允许所有认证用户修改）
-- =====================================================

-- 1. 启用 RLS
ALTER TABLE global_configs ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Authenticated users can view global configs" ON global_configs;
DROP POLICY IF EXISTS "Authenticated users can insert global configs" ON global_configs;
DROP POLICY IF EXISTS "Authenticated users can update global configs" ON global_configs;
DROP POLICY IF EXISTS "Authenticated users can delete global configs" ON global_configs;

-- 3. 创建 RLS 策略

-- 所有认证用户可以查看全局配置
CREATE POLICY "Authenticated users can view global configs"
ON global_configs
FOR SELECT
TO authenticated
USING (true);

-- 所有认证用户可以插入全局配置
CREATE POLICY "Authenticated users can insert global configs"
ON global_configs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 所有认证用户可以更新全局配置
CREATE POLICY "Authenticated users can update global configs"
ON global_configs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 所有认证用户可以删除全局配置
CREATE POLICY "Authenticated users can delete global configs"
ON global_configs
FOR DELETE
TO authenticated
USING (true);

SELECT '✅ global_configs 表的 RLS 策略已配置完成' AS status;

-- =====================================================
-- 可选：更严格的策略（仅管理员可修改）
-- =====================================================
-- 如果你想限制只有管理员可以修改配置，请使用以下策略替换上面的 INSERT/UPDATE/DELETE 策略：

-- DROP POLICY IF EXISTS "Authenticated users can insert global configs" ON global_configs;
-- DROP POLICY IF EXISTS "Authenticated users can update global configs" ON global_configs;
-- DROP POLICY IF EXISTS "Authenticated users can delete global configs" ON global_configs;

-- CREATE POLICY "Admins can insert global configs"
-- ON global_configs
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     EXISTS (
--         SELECT 1 FROM user_profiles
--         WHERE id = auth.uid() AND role = 'admin'
--     )
-- );

-- CREATE POLICY "Admins can update global configs"
-- ON global_configs
-- FOR UPDATE
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM user_profiles
--         WHERE id = auth.uid() AND role = 'admin'
--     )
-- )
-- WITH CHECK (
--     EXISTS (
--         SELECT 1 FROM user_profiles
--         WHERE id = auth.uid() AND role = 'admin'
--     )
-- );

-- CREATE POLICY "Admins can delete global configs"
-- ON global_configs
-- FOR DELETE
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM user_profiles
--         WHERE id = auth.uid() AND role = 'admin'
--     )
-- );
