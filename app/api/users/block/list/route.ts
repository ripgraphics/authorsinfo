import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

type BlockRow = { id: string; blocked_user_id: string; created_at: string | null }
type BlockedUserRow = { id: string; name: string | null; email: string | null; permalink: string | null }

export async function GET() {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const { data, error } = await authentication.context.supabase
      .from('blocks')
      .select('id, blocked_user_id, created_at')
      .eq('user_id', authentication.context.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const blockRows = (data ?? []) as unknown as BlockRow[]
    const blockedUserIds = blockRows.map((row) => row.blocked_user_id)
    if (blockedUserIds.length === 0) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'private, no-store' } })
    }

    const { data: users, error: usersError } = await authentication.context.supabase
      .from('users')
      .select('id, name, email, permalink')
      .in('id', blockedUserIds)

    if (usersError) throw usersError

    const userRows = (users ?? []) as unknown as BlockedUserRow[]
    const usersById = new Map(userRows.map((user) => [user.id, user]))
    return NextResponse.json(
      blockRows.map((row) => ({ ...row, user: usersById.get(row.blocked_user_id) ?? null })),
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load blocked users', 500, false)
  }
}
