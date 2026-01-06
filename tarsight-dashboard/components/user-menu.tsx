'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'

export function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await auth.getUser()
      setUser(userData)
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
      const name = user.user_metadata.full_name || user.user_metadata.name
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '用户'
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
        <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse" />
        <div className="w-24 h-4 bg-slate-700 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-white/5 text-slate-300 hover:text-white">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden md:inline-block">
            {getDisplayName()}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-800 border border-white/10 text-slate-200">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white">{getDisplayName()}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <User className="w-4 h-4 mr-2" />
          个人资料
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <Settings className="w-4 h-4 mr-2" />
          设置
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-white/5 focus:text-red-300">
          <LogOut className="w-4 h-4 mr-2" />
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
