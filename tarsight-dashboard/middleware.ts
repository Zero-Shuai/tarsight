import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 创建 Supabase 客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 调试日志
  console.log('Middleware:', {
    pathname,
    hasUser: !!user,
    userEmail: user?.email
  })

  // 如果用户已登录且访问登录页，重定向到首页
  if (user && pathname === '/login') {
    console.log('已登录用户访问登录页，重定向到首页')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 定义受保护的路由
  const protectedPaths = ['/test-cases', '/executions', '/analytics', '/settings', '/profile']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // 如果用户未登录且访问受保护页面，重定向到登录页
  if (!user && (pathname === '/' || isProtectedPath)) {
    console.log('未登录用户访问受保护页面，重定向到登录页')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// 配置需要保护的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
