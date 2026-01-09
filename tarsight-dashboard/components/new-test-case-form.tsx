/**
 * @deprecated
 *
 * ⚠️ 此组件已废弃，请勿使用！
 *
 * 废弃原因: 独立的新增页面已被抽屉式表单替代
 * 废弃日期: 2026-01-09
 * 替代方案: TestCaseFormDrawer (components/test-case-form-drawer.tsx)
 * 使用位置: app/(auth)/test-cases/new/page.tsx (也已废弃)
 *
 * 迁移指南:
 * - 使用 /test-cases 主页面的"新增测试用例"按钮
 * - 该按钮会打开 TestCaseFormDrawer 抽屉式表单
 *
 * 删除计划: 待确认无外部依赖后删除
 */
'use client'

import { useRouter } from 'next/navigation'
import { memo, useCallback } from 'react'
import { TestCaseForm } from './test-case-form'
import type { Module } from '@/lib/types/database'

interface NewTestCaseFormProps {
  modules: Module[]
}

function NewTestCaseFormComponent({ modules }: NewTestCaseFormProps) {
  const router = useRouter()

  // Memoized callbacks to prevent recreating on each render
  const handleSuccess = useCallback(() => {
    router.push('/test-cases')
  }, [router])

  const handleCancel = useCallback(() => {
    router.push('/test-cases')
  }, [router])

  return (
    <TestCaseForm
      modules={modules}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}

export const NewTestCaseForm = memo(NewTestCaseFormComponent)
