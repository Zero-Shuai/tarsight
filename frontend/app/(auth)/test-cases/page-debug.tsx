import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

export const runtime = 'edge'

export default async function TestCasesPageSimple() {
  let testCases: any[] = []
  let error: string | null = null
  let projectId: string | undefined

  try {
    projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const supabase = await createClient()

    const { data, error: fetchError } = await supabase
      .from('test_cases')
      .select('id, case_id, test_name, is_active')
      .limit(5)

    if (fetchError) {
      error = fetchError.message
    } else {
      testCases = data || []
    }
  } catch (err: any) {
    error = err.message
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>Test Cases Debug Page</h1>

      <Card style={{ marginBottom: '20px' }}>
        <CardContent style={{ padding: '20px' }}>
          <h3>Environment</h3>
          <p><strong>PROJECT_ID:</strong> {projectId || 'NOT SET'}</p>
          <p><strong>User Email:</strong> 243644123@qq.com</p>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: '20px' }}>
        <CardContent style={{ padding: '20px' }}>
          <h3>Database Query Result</h3>
          {error ? (
            <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>
          ) : (
            <>
              <p><strong>Count:</strong> {testCases.length} test cases found</p>
              <p><strong>Status:</strong> {testCases.length > 0 ? '✅ SUCCESS' : '⚠️ NO DATA'}</p>
            </>
          )}
        </CardContent>
      </Card>

      {testCases.length > 0 && (
        <Card>
          <CardContent style={{ padding: '20px' }}>
            <h3>Sample Data (First 5)</h3>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(testCases, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div style={{ marginTop: '20px' }}>
        <a href="/test-cases" style={{ color: 'blue', textDecoration: 'underline' }}>
          ← Back to Test Cases Page
        </a>
      </div>
    </div>
  )
}
