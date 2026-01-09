-- 添加验证规则字段到 test_cases 表
ALTER TABLE public.test_cases
ADD COLUMN IF NOT EXISTS validation_rules TEXT;

-- 添加注释
COMMENT ON COLUMN public.test_cases.validation_rules IS '验证规则 (JSON格式)，例如: {"type": "json_path", "checks": [{"path": "$.success", "operator": "equals", "value": true}, {"path": "$.code", "operator": "equals", "value": 200}]}。支持的操作符: equals(等于), contains(包含), not_contains(不包含), gt(大于), lt(小于), gte(大于等于), lte(小于等于)';
