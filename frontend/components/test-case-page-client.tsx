'use client'

import { useState, useCallback, memo } from 'react'
import { TestCaseWorkbench } from './test-case-workbench'
import type { TestCase, Module } from '@/lib/types/database'

interface TestCasePageClientProps {
  groupedCases: Record<string, TestCase[]>
  modules: Module[]
  initialTestCases: TestCase[]
}

function TestCasePageClientComponent({ groupedCases, modules, initialTestCases }: TestCasePageClientProps) {
  const [key, setKey] = useState(0)

  const handleUpdate = useCallback(() => {
    // Force re-render by updating key
    setKey(prev => prev + 1)
    // In a real implementation, you would refetch the data here
    window.location.reload()
  }, [])

  return (
    <TestCaseWorkbench
      key={key}
      groupedCases={groupedCases}
      modules={modules}
      initialTestCases={initialTestCases}
      onUpdate={handleUpdate}
    />
  )
}

export const TestCasePageClient = memo(TestCasePageClientComponent)
