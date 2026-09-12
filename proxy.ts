import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isApiAdminPath(pathname: string): boolean {
  return (
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/') ||
    pathname === '/api/debug' ||
    pathname.startsWith('/api/debug/')
  )
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  let authorized = !authError && !!user

  if (authorized && user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    const role = (profile as unknown as { role?: string } | null)?.role
    authorized = !profileError && (role === 'admin' || role === 'super_admin')
  }

  if (authorized) return response
  if (isApiAdminPath(request.nextUrl.pathname)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*', '/api/debug/:path*'] }
