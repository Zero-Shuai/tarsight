'use client'

import { useRouter } from 'next/navigation'
import { TestCaseForm } from './test-case-form'
import type { Module } from '@/lib/types/database'

interface NewTestCaseFormProps {
  modules: Module[]
}

export function NewTestCaseForm({ modules }: NewTestCaseFormProps) {
  const router = useRouter()

  return (
    <TestCaseForm
      modules={modules}
      onSuccess={() => {
        router.push('/test-cases')
      }}
      onCancel={() => {
        router.push('/test-cases')
      }}
    />
  )
}
