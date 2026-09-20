import { computeCallProviderStatus, redactCallSettings } from '@/lib/call-config'

test('keeps calls unavailable until enabled and providers are configured', () => {
  expect(
    computeCallProviderStatus({
      turn_provider: null,
      turn_url: null,
      turn_username: null,
      stun_url: null,
      signaling_server_url: null,
      calls_enabled: 'false',
    })
  ).toMatchObject({ ready: false, enabled: false, turnConfigured: false })

  expect(
    computeCallProviderStatus({
      turn_provider: 'coturn',
      turn_url: 'turn:turn.example.com:3478',
      turn_username: 'user',
      stun_url: 'stun:stun.example.com:3478',
      signaling_server_url: 'wss://signal.example.com',
      calls_enabled: 'true',
    })
  ).toMatchObject({ ready: true, enabled: true, turnConfigured: true, signalingConfigured: true })
})

test('supports provider-free direct WebRTC mode when calls are enabled', () => {
  expect(
    computeCallProviderStatus({
      turn_provider: null,
      turn_url: null,
      turn_username: null,
      stun_url: null,
      signaling_server_url: null,
      calls_enabled: 'true',
    })
  ).toMatchObject({
    ready: true,
    enabled: true,
    turnConfigured: false,
    signalingConfigured: false,
    mode: 'direct',
    signalingTransport: 'supabase-realtime',
  })
})

test('redacts call credentials from admin responses', () => {
  expect(
    redactCallSettings({
      turn_credential: 'secret',
      signaling_auth_token: 'token',
      turn_url: 'turn:example.com',
    })
  ).toEqual({
    turn_credential: 'configured',
    signaling_auth_token: 'configured',
    turn_url: 'turn:example.com',
  })
})
