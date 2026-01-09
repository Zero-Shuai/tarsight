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
