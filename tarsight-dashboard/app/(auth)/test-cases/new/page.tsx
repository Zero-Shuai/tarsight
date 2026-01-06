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
