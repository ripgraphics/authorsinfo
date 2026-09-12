import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'
import { computeCallProviderStatus, redactCallSettings } from '@/lib/call-config'

const ALLOWED_KEYS = [
  'turn_provider',
  'turn_url',
  'turn_username',
  'turn_credential',
  'stun_url',
  'signaling_server_url',
  'signaling_auth_token',
  'calls_enabled',
] as const

const updateSchema = z
  .object({
    turn_provider: z.string().trim().max(100).optional(),
    turn_url: z.string().trim().max(500).optional(),
    turn_username: z.string().trim().max(200).optional(),
    turn_credential: z.string().trim().max(500).optional(),
    stun_url: z.string().trim().max(500).optional(),
    signaling_server_url: z.string().trim().max(500).optional(),
    signaling_auth_token: z.string().trim().max(500).optional(),
    calls_enabled: z.enum(['true', 'false']).optional(),
  })
  .strict()

interface ConfigQuery {
  select(columns: string): ConfigQuery
  eq(column: string, value: string): ConfigQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  single(): Promise<{ data: unknown; error: unknown }>
  update(value: Record<string, string | null>): ConfigQuery
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface ConfigClient {
  from(table: 'call_provider_config'): ConfigQuery
}

function getClient(context: { supabase: unknown }): ConfigClient {
  return context.supabase as unknown as ConfigClient
}

export async function GET() {
  try {
    const authentication = await requireAdmin()
    if (!authentication.ok) return authentication.response

    const { data, error } = await getClient(authentication.context)
      .from('call_provider_config')
      .select('setting_key, setting_value, is_secret, updated_at')
    if (error) throw error

    const settings: Record<string, string | null> = {}
    for (const row of (data ?? []) as { setting_key: string; setting_value: string | null }[]) {
      settings[row.setting_key] = row.setting_value
    }

    const status = computeCallProviderStatus({
      turn_provider: settings.turn_provider ?? null,
      turn_url: settings.turn_url ?? null,
      turn_username: settings.turn_username ?? null,
      stun_url: settings.stun_url ?? null,
      signaling_server_url: settings.signaling_server_url ?? null,
      calls_enabled: settings.calls_enabled ?? null,
    })

    return NextResponse.json(
      { settings: redactCallSettings(settings), status },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load call settings', 500, false)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authentication = await requireAdmin()
    if (!authentication.ok) return authentication.response

    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const input = updateSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid call settings' }, { status: 400 })
    }

    const client = getClient(authentication.context)
    for (const [key, value] of Object.entries(input.data)) {
      if (!ALLOWED_KEYS.includes(key as (typeof ALLOWED_KEYS)[number])) continue
      const { error } = await client
        .from('call_provider_config')
        .update({ setting_value: value ?? null, updated_by: authentication.context.user.id })
        .eq('setting_key', key)
      if (error) throw error
    }

    const { data, error: readError } = await client
      .from('call_provider_config')
      .select('setting_key, setting_value')
    if (readError) throw readError

    const settings: Record<string, string | null> = {}
    for (const row of (data ?? []) as { setting_key: string; setting_value: string | null }[]) {
      settings[row.setting_key] = row.setting_value
    }

    const status = computeCallProviderStatus({
      turn_provider: settings.turn_provider ?? null,
      turn_url: settings.turn_url ?? null,
      turn_username: settings.turn_username ?? null,
      stun_url: settings.stun_url ?? null,
      signaling_server_url: settings.signaling_server_url ?? null,
      calls_enabled: settings.calls_enabled ?? null,
    })

    return NextResponse.json(
      { settings: redactCallSettings(settings), status },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update call settings', 500, false)
  }
}
