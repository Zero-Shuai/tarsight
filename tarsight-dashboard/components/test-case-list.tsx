'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Box, TestTube, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { TestCaseActions } from './test-case-actions'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import type { TestCase, Module } from '@/lib/types/database'

interface TestCaseListProps {
  groupedCases: Record<string, TestCase[]>
  modules: Module[]
  initialTestCases: TestCase[]
}

export function TestCaseList({ groupedCases, modules, initialTestCases }: TestCaseListProps) {
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

  return (
    <>
      {/* 测试用例列表 */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 ease-out">
        {Object.entries(currentGroupedCases).map(([moduleName, cases]) => (
          <Card key={moduleName} className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-slate-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <TestTube className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">{moduleName}</CardTitle>
                    <CardDescription className="text-slate-500">{cases.length} 个测试用例</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {cases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="group flex items-start justify-between p-4 rounded-lg hover:bg-slate-50 hover:shadow-sm transition-all duration-200 border border-slate-50 hover:border-slate-100 cursor-pointer"
                  >
                    <Link
                      href={`/test-cases/${testCase.id}`}
                      className="flex-1 flex gap-4"
                    >
                      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Box className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono text-slate-600">{testCase.case_id}</span>
                          <Badge
                            variant="outline"
                            className="bg-slate-50 text-slate-700 border-slate-100 font-medium"
                          >
                            {testCase.method}
                          </Badge>
                          <Badge
                            className={
                              testCase.level === 'P0'
                                ? 'bg-rose-50 text-rose-600 border-rose-100 font-medium'
                                : testCase.level === 'P1'
                                ? 'bg-amber-50 text-amber-600 border-amber-100 font-medium'
                                : 'bg-slate-50 text-slate-600 border-slate-100 font-medium'
                            }
                          >
                            {testCase.level || 'P2'}
                          </Badge>
                          {testCase.is_active && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              活跃
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-900">{testCase.test_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{testCase.method} {testCase.url}</p>
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
        {Object.keys(currentGroupedCases).length === 0 && (
          <Card className="rounded-xl shadow-sm bg-white border border-slate-50">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-slate-100 mb-6">
                  <TestTube className="h-12 w-12 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">暂无测试用例</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                  点击上方"新建用例"按钮创建第一个测试用例。开始构建您的测试用例库。
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
