import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '8786c21f-7437-4a2d-8486-9365a382b38e'

  const debugInfo: any = {
    projectId,
    envProjectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  }

  // Try to get cookies directly
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  debugInfo.cookies = {
    count: allCookies.length,
    names: allCookies.map(c => c.name),
    hasSupabaseCookies: allCookies.some(c => c.name.startsWith('sb-'))
  }

  // Get user info FIRST
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  debugInfo.user = {
    email: user?.email || null,
    id: user?.id || null,
    error: userError?.message || null
  }

  // Get all test cases with anon key (respects RLS)
  const { data: allCases, error: allError } = await supabase
    .from('test_cases')
    .select('id, case_id, test_name, project_id, is_active')
    .limit(10)

  debugInfo.allTestCases = {
    count: allCases?.length || 0,
    error: allError?.message || null,
    sample: allCases?.slice(0, 3) || []
  }

  // Get filtered test cases with anon key (respects RLS)
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

  // Get modules with anon key (respects RLS)
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

  // Bypass RLS with service role to verify data exists
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabaseAdmin = createServiceRoleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: adminCases, count: adminCount } = await supabaseAdmin
      .from('test_cases')
      .select('*', { count: 'exact', head: false })
      .eq('project_id', projectId)

    debugInfo.adminTestCases = {
      count: adminCount || 0,
      hasData: (adminCases?.length || 0) > 0,
      sample: adminCases?.slice(0, 3) || []
    }
  }

  return NextResponse.json(debugInfo)
}
