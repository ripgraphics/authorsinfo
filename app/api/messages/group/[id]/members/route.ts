import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const identifier = z.string().uuid()
type GroupMembersContext = { params: Promise<{ id: string }> }

type MemberRow = {
  user_id: string
  role_id: string | null
  user?: { id: string; name?: string | null; email?: string | null } | null
  role?: { id: string; name?: string | null } | null
}
type UserRow = { id: string; name?: string | null; email?: string | null }
type RoleRow = { id: string; name?: string | null }

interface MembersQuery {
  select(columns: string): MembersQuery
  eq(column: string, value: string): MembersQuery
  order(column: string, options: { ascending: boolean }): MembersQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface MembersClient {
  from(table: 'group_members'): MembersQuery
}

function getMembersClient(context: AuthenticatedRoute): MembersClient {
  return context.supabase as unknown as MembersClient
}

export async function GET(_request: Request, { params }: GroupMembersContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const { id } = await params
    if (!identifier.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid group request' }, { status: 400 })
    }

    const supabase = getMembersClient(authentication.context)
    const membershipQuery = supabase.from('group_members')
    const { data: membership, error: membershipError } = await membershipQuery
      .select('group_id')
      .eq('group_id', id)
      .eq('user_id', authentication.context.user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (membershipError) throw membershipError
    if (!membership) {
      return NextResponse.json({ error: 'Active group membership required' }, { status: 403 })
    }

    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, role_id')
      .eq('group_id', id)
      .eq('status', 'active')
    if (membersError) throw membersError

    const memberRows = (members ?? []) as unknown as MemberRow[]
    const nestedIdentities = memberRows.filter((member) => member.user?.id)
    if (nestedIdentities.length === memberRows.length) {
      return NextResponse.json(
        nestedIdentities.map((member) => ({
          id: member.user!.id,
          name: member.user!.name ?? member.user!.email ?? null,
          email: member.user!.email ?? null,
          ...(member.role?.name ? { role: member.role.name } : {}),
        })),
        { headers: { 'Cache-Control': 'private, no-store' } }
      )
    }
    const userIds = memberRows.map((member) => member.user_id)
    const roleIds = memberRows.map((member) => member.role_id).filter(Boolean)
    const [{ data: users, error: usersError }, { data: roles, error: rolesError }] = await Promise.all([
      (supabase as any).from('users').select('id, name, email').in('id', userIds),
      (supabase as any).from('group_roles').select('id, name').in('id', roleIds),
    ])
    if (usersError) throw usersError
    if (rolesError) throw rolesError

    const userRows = (users ?? []) as UserRow[]
    const roleRows = (roles ?? []) as RoleRow[]
    const usersById = new Map<string, UserRow>(userRows.map((user) => [user.id, user]))
    const rolesById = new Map<string, RoleRow>(roleRows.map((role) => [role.id, role]))
    const identities = memberRows
      .map((member) => {
        const user = usersById.get(member.user_id)
        const role = member.role_id ? rolesById.get(member.role_id) : null
        if (!user) return null
        return {
          id: user.id,
          name: user.name ?? user.email ?? null,
          email: user.email ?? null,
          ...(role?.name ? { role: role.name } : {}),
        }
      })
      .filter(Boolean)

    return NextResponse.json(identities, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load Messenger group members', 500, false)
  }
}
