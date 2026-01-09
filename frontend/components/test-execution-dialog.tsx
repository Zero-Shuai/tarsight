'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Play } from 'lucide-react'
import { TestExecutionForm } from '@/components/test-execution-form'

interface Module {
  id: string
  name: string
}

interface TestExecutionDialogProps {
  modules: Module[]
}

function TestExecutionDialogComponent({ modules }: TestExecutionDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Play className="mr-2 h-4 w-4" />
          批量执行
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量执行测试用例</DialogTitle>
          <DialogDescription>
            选择执行模式和筛选条件，预览后将执行测试用例
          </DialogDescription>
        </DialogHeader>
        <TestExecutionForm allModules={modules} />
      </DialogContent>
    </Dialog>
  )
}

export const TestExecutionDialog = memo(TestExecutionDialogComponent)
