import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const debugInfo: any = {
    projectId,
    envProjectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  }

  // Get all test cases (no filters)
  const { data: allCases, error: allError } = await supabase
    .from('test_cases')
    .select('id, case_id, test_name, project_id, is_active')
    .limit(10)

  debugInfo.allTestCases = {
    count: allCases?.length || 0,
    error: allError?.message || null,
    sample: allCases?.slice(0, 3) || []
  }

  // Get filtered test cases
  const { data: filteredCases, error: filteredError } = await supabase
    .from('test_cases')
    .select('*')
    .eq('project_id', projectId)
    .limit(10)

  debugInfo.filteredTestCases = {
    count: filteredCases?.length || 0,
    error: filteredError?.message || null,
    sample: filteredCases?.slice(0, 3) || []
  }

  // Get modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('project_id', projectId)
    .limit(10)

  debugInfo.modules = {
    count: modules?.length || 0,
    error: modulesError?.message || null,
    sample: modules?.slice(0, 3) || []
  }

  // Get user info
  const { data: { user } } = await supabase.auth.getUser()
  debugInfo.user = {
    email: user?.email || null,
    id: user?.id || null
  }

  return NextResponse.json(debugInfo)
}
