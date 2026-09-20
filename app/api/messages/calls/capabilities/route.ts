import { NextResponse } from 'next/server'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'
import { computeCallProviderStatus, type CallProviderSettings } from '@/lib/call-config'

interface ConfigQuery {
  select(columns: string): ConfigQuery
  then<
    TResult1 = {
      data: { setting_key: string; setting_value: string | null }[] | null
      error: unknown
    },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((value: {
          data: { setting_key: string; setting_value: string | null }[] | null
          error: unknown
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface ConfigClient {
  from(table: 'call_provider_config'): ConfigQuery
}

function getClient(context: AuthenticatedRoute): ConfigClient {
  return context.supabase as unknown as ConfigClient
}

export async function GET() {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const { data, error } = await getClient(authentication.context)
      .from('call_provider_config')
      .select('setting_key, setting_value')
    if (error) throw error

    const settings: CallProviderSettings = {
      turn_provider: null,
      turn_url: null,
      turn_username: null,
      stun_url: null,
      signaling_server_url: null,
      calls_enabled: null,
    }
    for (const row of data ?? []) {
      if (row.setting_key in settings) {
        settings[row.setting_key as keyof CallProviderSettings] = row.setting_value
      }
    }

    const status = computeCallProviderStatus(settings)
    return NextResponse.json(
      {
        ready: status.ready,
        reason: status.reason,
        enabled: status.enabled,
        mode: status.mode,
        signaling_transport: status.signalingTransport,
        turn_url: status.turnUrl,
        stun_url: status.stunUrl,
        signaling_url: status.signalingUrl,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load call capability', 500, false)
  }
}
