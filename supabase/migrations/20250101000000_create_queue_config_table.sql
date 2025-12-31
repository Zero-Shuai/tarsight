-- 队列配置表
-- 存储测试执行队列的配置参数

CREATE TABLE IF NOT EXISTS queue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, key)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_queue_config_project_id ON queue_config(project_id);

-- 插入默认配置
INSERT INTO queue_config (project_id, key, value, description)
SELECT
  id,
  'max_concurrent',
  '2',
  '最大并发执行数（建议2-3个）'
FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM queue_config WHERE key = 'max_concurrent' AND project_id = projects.id
);

INSERT INTO queue_config (project_id, key, value, description)
SELECT
  id,
  'timeout_minutes',
  '10',
  '单个测试执行超时时间（分钟）'
FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM queue_config WHERE key = 'timeout_minutes' AND project_id = projects.id
);

INSERT INTO queue_config (project_id, key, value, description)
SELECT
  id,
  'queue_enabled',
  'true',
  '是否启用队列管理'
FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM queue_config WHERE key = 'queue_enabled' AND project_id = projects.id
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_queue_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queue_config_updated_at
  BEFORE UPDATE ON queue_config
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_config_updated_at();

-- 添加 RLS 策略
ALTER TABLE queue_config ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己项目的队列配置
CREATE POLICY "Users can view queue config for their project"
  ON queue_config FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- 用户可以更新自己项目的队列配置
CREATE POLICY "Users can update queue config for their project"
  ON queue_config FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- 用户可以插入自己项目的队列配置
CREATE POLICY "Users can insert queue config for their project"
  ON queue_config FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
