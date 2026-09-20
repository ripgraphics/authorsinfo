import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const identifier = z.string().uuid()
type GroupMembersContext = { params: Promise<{ id: string }> }

type MemberRow = {
  user_id: string
  user: {
    id: string
    name: string | null
    avatar_url?: string | null
  } | null
}

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
      .select('user_id, user:users(id, name, avatar_url)')
      .eq('group_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
    if (membersError) throw membersError

    const identities = ((members ?? []) as unknown as MemberRow[])
      .map((member) => member.user)
      .filter((member): member is NonNullable<MemberRow['user']> => Boolean(member?.id))
      .map((member) => ({
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url ?? null,
      }))

    return NextResponse.json(identities, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load Messenger group members', 500, false)
  }
}
