import { getMatrixCapabilityStatus, probeMatrixHomeserver } from '@/lib/matrix-config'

afterEach(() => {
  delete process.env.MATRIX_HOMESERVER_URL
  delete process.env.MATRIX_PRIVATE_ROOM_CREATION_ENABLED
})

test('private messaging is not ready without configured infrastructure', () => {
  expect(getMatrixCapabilityStatus()).toMatchObject({
    configured: false,
    enabled: false,
    ready: false,
    oidcConfigured: false,
    securityApproved: false,
  })
})

test('configured infrastructure stays gated until explicitly enabled', () => {
  process.env.MATRIX_HOMESERVER_URL = 'http://localhost:8008'
  expect(getMatrixCapabilityStatus()).toMatchObject({
    configured: true,
    enabled: false,
    ready: false,
    oidcConfigured: false,
    securityApproved: false,
  })
})

test('private messaging becomes ready only when configured and enabled', () => {
  process.env.MATRIX_HOMESERVER_URL = 'https://matrix.example.com'
  process.env.MATRIX_PRIVATE_ROOM_CREATION_ENABLED = 'true'
  process.env.MATRIX_OIDC_ISSUER = 'https://auth.example.com'
  process.env.MATRIX_OIDC_CLIENT_ID = 'authors-info'
  process.env.MATRIX_E2EE_SECURITY_APPROVED = 'true'
  expect(getMatrixCapabilityStatus()).toMatchObject({
    configured: true,
    enabled: true,
    ready: false,
    oidcConfigured: true,
    securityApproved: true,
  })
})

test('homeserver probe reports supported Matrix versions without enabling messaging', async () => {
  process.env.MATRIX_HOMESERVER_URL = 'http://localhost:8008'
  const originalFetch = global.fetch
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ versions: ['v1.12'] }),
  })
  global.fetch = fetchMock as typeof fetch
  await expect(probeMatrixHomeserver()).resolves.toMatchObject({
    configured: true,
    reachable: true,
    supportedVersions: ['v1.12'],
    ready: false,
  })
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:8008/_matrix/client/versions',
    expect.objectContaining({ cache: 'no-store' })
  )
  global.fetch = originalFetch
})
