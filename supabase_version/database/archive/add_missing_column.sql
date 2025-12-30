-- 添加缺少的 started_by 列
-- 如果执行失败，说明列已经存在，可以忽略

ALTER TABLE public.test_executions
ADD COLUMN IF NOT EXISTS started_by UUID;