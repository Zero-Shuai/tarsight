import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * 创建具有管理员权限的 Supabase 客户端
 * 使用 service role key 绕过 RLS 策略
 * 仅在服务器端 API 路由中使用
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
