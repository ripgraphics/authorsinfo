import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
type Context = { params: Promise<{ id: string }> }

interface Query {
  select(columns: string): Query
  eq(column: string, value: string): Query
  order(column: string, options: { ascending: boolean }): Query
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>
}

interface Client {
  from(table: 'group_members' | 'group_roles'): Query
}

function getClient(context: AuthenticatedRoute): Client {
  return context.supabase as unknown as Client
}

export async function GET(_: Request, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!uuid.safeParse(id).success) return NextResponse.json({ error: 'Invalid group request' }, { status: 400 })

    const client = getClient(authentication.context)
    const { data: membership, error: membershipError } = await client
      .from('group_members')
      .select('group_id')
      .eq('group_id', id)
      .eq('user_id', authentication.context.user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (membershipError) throw membershipError
    if (!membership) return NextResponse.json({ error: 'Active group membership required' }, { status: 403 })

    const { data: roles, error: rolesError } = await client
      .from('group_roles')
      .select('id, group_id, name, description, permissions, is_default, created_at, updated_at')
      .eq('group_id', id)
      .order('name', { ascending: true })
    if (rolesError) throw rolesError
    return NextResponse.json(roles ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load Messenger group roles', 500, false)
  }
}
