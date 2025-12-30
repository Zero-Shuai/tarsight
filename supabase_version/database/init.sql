-- ============================================================================
-- Tarsight - 快速初始化脚本
-- 用途: 快速创建Tarsight项目所需的表和初始数据
-- 适用于: 首次部署或全新安装
-- ============================================================================

-- 这个文件会调用完整schema
\ir schema/01_complete_schema.sql

-- 插入默认Tarsight项目
DO $$
DECLARE
    tarsight_project UUID;
BEGIN
    -- 检查是否已存在Tarsight项目
    SELECT id INTO tarsight_project
    FROM public.projects
    WHERE name = 'Tarsight'
    LIMIT 1;

    -- 如果不存在,则创建
    IF tarsight_project IS NULL THEN
        INSERT INTO public.projects (name, description, base_url)
        VALUES (
            'Tarsight',
            'Tarsight API测试平台',
            'https://t-stream-iq.tarsv.com'
        )
        RETURNING id INTO tarsight_project;

        RAISE NOTICE '已创建Tarsight项目, ID: %', tarsight_project;
    ELSE
        RAISE NOTICE 'Tarsight项目已存在, ID: %', tarsight_project;
    END IF;
END $$;

-- 完成
SELECT 'Tarsight初始化完成!' as status;
