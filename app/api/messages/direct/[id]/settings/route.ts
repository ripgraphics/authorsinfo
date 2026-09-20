import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const settingsSchema = z.object({ is_archived: z.boolean().optional(), is_muted: z.boolean().optional() }).strict()
type Context = { params: Promise<{ id: string }> }

interface SettingsQuery {
  select(columns: string): SettingsQuery
  eq(column: string, value: string): SettingsQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  upsert(value: Record<string, string | boolean>): SettingsQuery
  single(): Promise<{ data: unknown; error: unknown }>
}

interface SettingsClient {
  from(table: 'direct_conversations' | 'direct_conversation_settings'): SettingsQuery
}

function getClient(context: AuthenticatedRoute): SettingsClient {
  return context.supabase as unknown as SettingsClient
}

async function authorize(context: AuthenticatedRoute, conversationId: string) {
  const { data, error } = await getClient(context)
    .from('direct_conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  return data ? null : NextResponse.json({ error: 'Conversation access denied' }, { status: 403 })
}

export async function GET(_: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!uuid.safeParse(id).success) return NextResponse.json({ error: 'Invalid settings request' }, { status: 400 })
    const denied = await authorize(authentication.context, id)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('direct_conversation_settings')
      .select('conversation_id, user_id, is_archived, is_muted, updated_at')
      .eq('conversation_id', id)
      .eq('user_id', authentication.context.user.id)
      .maybeSingle()
    if (error) throw error
    return NextResponse.json(data ?? {
      conversation_id: id,
      user_id: authentication.context.user.id,
      is_archived: false,
      is_muted: false,
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load conversation settings', 500, false)
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    const { id } = await params
    const input = settingsSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(id).success || !input.success || Object.keys(input.data).length === 0) {
      return NextResponse.json({ error: 'Invalid conversation settings' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, id)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('direct_conversation_settings')
      .upsert({ conversation_id: id, user_id: authentication.context.user.id, ...input.data, updated_at: new Date().toISOString() })
      .select('conversation_id, user_id, is_archived, is_muted, updated_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update conversation settings', 500, false)
  }
}