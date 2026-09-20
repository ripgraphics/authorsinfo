import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const identifier = z.string().uuid()
type Context = { params: Promise<{ id: string }> }

interface EventQuery {
  select(columns: string): EventQuery
  eq(column: string, value: string | boolean): EventQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface EventClient {
  from(table: 'events' | 'user_permissions'): EventQuery
}

function getClient(context: AuthenticatedRoute): EventClient {
  return context.supabase as unknown as EventClient
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!identifier.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event target request' }, { status: 400 })
    }

    const client = getClient(authentication.context)
    const { data: event, error } = await client
      .from('events')
      .select('id, title, created_by, status, visibility')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const record = event as {
      id: string
      title: string
      created_by: string | null
      status?: string | null
      visibility?: string | null
    }
    const { data: admins, error: adminError } = await client
      .from('user_permissions')
      .select('user_id')
      .eq('is_admin', true)
    if (adminError) throw adminError

    const isPlatformAdmin = (admins ?? []).some(
      (admin) => (admin as { user_id?: string }).user_id === authentication.context.user.id
    )
    const isOwner = record.created_by === authentication.context.user.id
    const isPublicPublished = record.status === 'published' && record.visibility === 'public'
    if (!isPublicPublished && !isOwner && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Event messaging access denied' }, { status: 403 })
    }

    const targetMap = new Map<string, { user_id: string; role: 'owner' | 'admin' }>()
    if (record.created_by) targetMap.set(record.created_by, { user_id: record.created_by, role: 'owner' })
    for (const admin of (admins ?? []) as Array<{ user_id?: string }>) {
      if (admin.user_id && !targetMap.has(admin.user_id)) {
        targetMap.set(admin.user_id, { user_id: admin.user_id, role: 'admin' })
      }
    }
    const targets = Array.from(targetMap.values())
    return NextResponse.json({
      entity_type: 'event',
      entity_id: record.id,
      title: record.title,
      targets,
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to resolve event message targets', 500, false)
  }
}
