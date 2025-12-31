'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ListChecks,
  History,
  BarChart3,
  Settings,
  Key,
  FolderOpen,
} from 'lucide-react'
import { UserMenu } from '@/components/user-menu'

const navItems = [
  {
    title: '总览',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: '模块管理',
    href: '/modules',
    icon: FolderOpen,
  },
  {
    title: '测试用例',
    href: '/test-cases',
    icon: ListChecks,
  },
  {
    title: '执行历史',
    href: '/executions',
    icon: History,
  },
  {
    title: '统计分析',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: '系统设置',
    href: '/settings',
    icon: Settings,
  },
  {
    title: '项目管理',
    href: '/projects',
    icon: Key,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b border-gray-200 px-6 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Tarsight</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        <div className="mb-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          主菜单
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          账户
        </div>
        <UserMenu />
      </div>
    </div>
  )
}
