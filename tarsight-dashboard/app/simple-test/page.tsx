import { createClient } from '@/lib/supabase/server'

export default async function SimpleTestPage() {
  const supabase = await createClient()

  const { data: testCases, error } = await supabase
    .from('test_cases')
    .select('id')
    .limit(1)

  const count = testCases?.length || 0

  return (
    <div style={{ padding: '50px', fontFamily: 'monospace' }}>
      <h1>Simple Database Test</h1>
      <p>Test cases in database: <strong>{count}</strong></p>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <p>Count: {count > 0 ? <span style={{ color: 'green' }}>✅ Data exists!</span> : <span style={{ color: 'red' }}>❌ No data found</span>}</p>
      <a href="/test-cases">Go to Test Cases Page</a>
    </div>
  )
}
