export interface CallProviderStatus {
  enabled: boolean
  ready: boolean
  reason: string | null
  turnConfigured: boolean
  signalingConfigured: boolean
  turnUrl: string | null
  stunUrl: string | null
  signalingUrl: string | null
}

export interface CallProviderSettings {
  turn_provider: string | null
  turn_url: string | null
  turn_username: string | null
  stun_url: string | null
  signaling_server_url: string | null
  calls_enabled: string | null
}

const REQUIRED_KEYS = ['turn_url', 'signaling_server_url'] as const

export function computeCallProviderStatus(settings: CallProviderSettings): CallProviderStatus {
  const enabled = settings.calls_enabled === 'true'
  const turnConfigured = REQUIRED_KEYS.every((key) =>
    Boolean(settings[key] && settings[key].trim())
  )
  const signalingConfigured = Boolean(
    settings.signaling_server_url && settings.signaling_server_url.trim()
  )
  const ready = enabled && turnConfigured && signalingConfigured

  let reason: string | null = null
  if (!enabled) reason = 'Calls are disabled by the administrator.'
  else if (!turnConfigured) reason = 'TURN server is not configured.'
  else if (!signalingConfigured) reason = 'Signaling server is not configured.'

  return {
    enabled,
    ready,
    reason,
    turnConfigured,
    signalingConfigured,
    turnUrl: settings.turn_url?.trim() || null,
    stunUrl: settings.stun_url?.trim() || null,
    signalingUrl: settings.signaling_server_url?.trim() || null,
  }
}

export function redactCallSettings(
  settings: Record<string, string | null>
): Record<string, string | null> {
  const redacted: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(settings)) {
    if (key.includes('credential') || key.includes('token')) {
      redacted[key] = value ? 'configured' : null
    } else {
      redacted[key] = value
    }
  }
  return redacted
}
