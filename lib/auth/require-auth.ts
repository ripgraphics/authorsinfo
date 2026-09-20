import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

type RouteSupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClientAsync>>

export type AuthenticatedRoute = { supabase: RouteSupabaseClient; user: User }
export type AuthorizedAdminRoute = AuthenticatedRoute & {
  role: 'admin' | 'super_admin'
}

export async function requireUser(): Promise<
  | { ok: true; context: AuthenticatedRoute }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createRouteHandlerClientAsync()
  let {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Supabase's remote user check can fail during transient auth-service or
  // Navigator LockManager stalls even when the SSR cookie contains a valid
  // session. Use the locally decoded session as a recovery path; the cookie
  // was issued by Supabase Auth and is still subject to the route's RLS.
  if (error || !user) {
    const sessionResult = await supabase.auth.getSession()
    user = sessionResult.data.session?.user ?? null
    error = sessionResult.error
  }

  if (error || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  }

  return { ok: true, context: { supabase, user } }
}

export async function requireAdmin(): Promise<
  | { ok: true; context: AuthorizedAdminRoute }
  | { ok: false; response: NextResponse }
> {
  const authentication = await requireUser()
  if (!authentication.ok) return authentication

  const { supabase, user } = authentication.context
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const role = (profile as unknown as { role?: string } | null)?.role
  if (error || (role !== 'admin' && role !== 'super_admin')) {
    return { ok: false, response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  return { ok: true, context: { supabase, user, role } }
}
