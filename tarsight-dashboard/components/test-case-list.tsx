'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { TestCaseForm } from './test-case-form'
import { TestCaseActions } from './test-case-actions'
import { supabase as supabaseClient } from '@/lib/supabase/client'

interface TestCaseListProps {
  groupedCases: Record<string, TestCase[]>
  modules: Module[]
  initialTestCases: TestCase[]
}

export function TestCaseList({ groupedCases, modules, initialTestCases }: TestCaseListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [testCases, setTestCases] = useState(initialTestCases)

  const refreshData = async () => {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const { data } = await supabaseClient
      .from('test_cases')
      .select('*')
      .eq('project_id', projectId!)
      .eq('is_active', true)
      .order('case_id')

    if (data) {
      setTestCases(data)
      setShowCreateForm(false)
    }
  }

  // 重新分组
  const currentGroupedCases = testCases.reduce((acc, tc) => {
    const module = modules.find(m => m.id === tc.module_id)
    const moduleName = module?.name || 'Unknown'
    if (!acc[moduleName]) {
      acc[moduleName] = []
    }
    acc[moduleName].push(tc)
    return acc
  }, {} as Record<string, TestCase[]>)

  if (showCreateForm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
          <TestCaseForm
            modules={modules}
            onSuccess={() => {
              refreshData()
              setShowCreateForm(false)
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 创建按钮 */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新增测试用例
        </Button>
      </div>

      {/* 测试用例列表 */}
      <div className="space-y-6">
        {Object.entries(currentGroupedCases).map(([moduleName, cases]) => (
          <Card key={moduleName}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{moduleName}</CardTitle>
                  <CardDescription>{cases.length} 个测试用例</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0 group"
                  >
                    <Link
                      href={`/test-cases/${testCase.id}`}
                      className="flex-1 hover:bg-muted/50 transition-colors -mx-2 px-2 rounded py-1"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{testCase.case_id}</span>
                          <Badge variant="outline">{testCase.method}</Badge>
                          {testCase.is_active && (
                            <Badge variant="default" className="bg-green-500">活跃</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{testCase.test_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{testCase.url}</p>
                        {testCase.description && (
                          <p className="text-sm text-muted-foreground mt-1">{testCase.description}</p>
                        )}
                        {testCase.tags && testCase.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {testCase.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TestCaseActions
                        testCase={testCase}
                        modules={modules}
                        onUpdate={refreshData}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
