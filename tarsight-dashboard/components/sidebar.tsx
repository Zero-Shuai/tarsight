'use client'

import { memo } from 'react'
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
] as const

function SidebarComponent() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-[#0f172a]/95 backdrop-blur-sm border-r border-white/10">
      {/* Logo 区域 */}
      <div className="flex h-16 items-center border-b border-white/10 px-6 bg-[#0f172a]/50 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tarsight</h1>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
        <div className="mb-5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-600/15 to-blue-600/5 text-blue-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              )}
            >
              {/* 激活态的左侧蓝色亮条 (3px) */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-gradient-to-b from-blue-400 to-blue-500 rounded-full" />
              )}

              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* 底部用户区域 */}
      <div className="border-t border-white/10 p-4 bg-[#0f172a]/50 backdrop-blur-sm">
        <div className="mb-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          账户
        </div>
        <UserMenu />
      </div>
    </div>
  )
}

export const Sidebar = memo(SidebarComponent)
