import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test basic connection
    const { data: { user } } = await supabase.auth.getUser()

    // Test database query
    const { data: testCases, error } = await supabase
      .from('test_cases')
      .select('id')
      .limit(1)

    return NextResponse.json({
      success: true,
      user: user?.email || 'not logged in',
      testCasesCount: testCases?.length ?? 0,
      error: error?.message || null,
      message: (testCases?.length ?? 0) > 0
        ? '✅ Database connection working, test cases found!'
        : '⚠️ Database connection working but NO test cases found'
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      message: '❌ Database connection failed'
    }, { status: 500 })
  }
}
