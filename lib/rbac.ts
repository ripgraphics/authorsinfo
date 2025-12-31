import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export type Role = 'user' | 'admin' | 'super_admin' | 'moderator'

export const PERMISSIONS = {
  'view:dashboard': ['user', 'admin', 'super_admin', 'moderator'],
  'manage:users': ['admin', 'super_admin'],
  'manage:content': ['admin', 'super_admin', 'moderator'],
  'delete:content': ['admin', 'super_admin'],
  'view:analytics': ['admin', 'super_admin'],
} as const

export type Permission = keyof typeof PERMISSIONS

export async function getCurrentUserRole(): Promise<Role> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return 'user'
    }

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    return (profile?.role as Role) || 'user'
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user role')
    return 'user'
  }
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const role = await getCurrentUserRole()
  const allowedRoles = PERMISSIONS[permission] as readonly Role[]

  return allowedRoles.includes(role)
}

export async function requirePermission(permission: Permission) {
  const hasAccess = await hasPermission(permission)

  if (!hasAccess) {
    throw new Error('Unauthorized: Insufficient permissions')
  }
}
