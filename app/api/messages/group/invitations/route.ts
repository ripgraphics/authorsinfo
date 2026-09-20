import { NextResponse } from 'next/server'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

interface InvitationQuery {
  select(columns: string): InvitationQuery
  eq(column: string, value: string): InvitationQuery
  or(expression: string): InvitationQuery
  order(column: string, options: { ascending: boolean }): InvitationQuery
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface InvitationClient {
  from(table: 'group_invitations'): InvitationQuery
}

function getInvitationClient(context: AuthenticatedRoute): InvitationClient {
  return context.supabase as unknown as InvitationClient
}

export async function GET() {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const { user } = authentication.context
    const email = user.email?.trim().toLowerCase()
    const recipientFilter = email
      ? `invitee_user_id.eq.${user.id},invitee_email.eq.${email}`
      : `invitee_user_id.eq.${user.id}`
    const { data, error } = await getInvitationClient(authentication.context)
      .from('group_invitations')
      .select('id, group_id, inviter_id, invitee_email, invitee_user_id, role_id, status, message, expires_at, created_at')
      .eq('status', 'pending')
      .or(recipientFilter)
      .order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load pending group invitations', 500, false)
  }
}
