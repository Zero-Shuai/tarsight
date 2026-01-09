/**
 * @deprecated
 *
 * ⚠️ 此页面已废弃，请勿使用！
 *
 * 废弃原因: 独立的新增页面用户体验不如抽屉式表单
 * 废弃日期: 2026-01-09
 * 替代方案: /test-cases 主页面 + TestCaseFormDrawer 抽屉
 *
 * 迁移指南:
 * 1. 访问 /test-cases 主页面
 * 2. 点击右上角"新增测试用例"按钮
 * 3. 在打开的抽屉中填写测试用例信息
 *
 * 删除计划: 待确认无外部链接或书签后删除
 *
 * 依赖组件:
 * - components/new-test-case-form.tsx (已废弃)
 * - components/test-case-form.tsx (部分废弃)
 */
import { createClient } from '@/lib/supabase/server'
import { NewTestCaseForm } from '@/components/new-test-case-form'

async function getModules() {
  const supabase = await createClient()
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const { data } = await supabase
    .from('modules')
    .select('*')
    .eq('project_id', projectId)
    .order('name')

  return data || []
}

export default async function NewTestCasePage() {
  const modules = await getModules()

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">新建测试用例</h1>
        <NewTestCaseForm modules={modules} />
      </div>
    </div>
  )
}
