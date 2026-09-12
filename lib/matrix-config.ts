export interface MatrixCapabilityStatus {
  configured: boolean
  enabled: boolean
  ready: boolean
  oidcConfigured: boolean
  securityApproved: boolean
  homeserverUrl: string | null
  reason: string | null
  reachable: boolean
  supportedVersions: string[]
}

export function getMatrixCapabilityStatus(): MatrixCapabilityStatus {
  const homeserverUrl = process.env.MATRIX_HOMESERVER_URL?.trim() || null
  const configured = Boolean(homeserverUrl)
  const enabled = process.env.MATRIX_PRIVATE_ROOM_CREATION_ENABLED === 'true'
  const oidcConfigured = Boolean(
    process.env.MATRIX_OIDC_ISSUER?.trim() && process.env.MATRIX_OIDC_CLIENT_ID?.trim()
  )
  const securityApproved = process.env.MATRIX_E2EE_SECURITY_APPROVED === 'true'

  return {
    configured,
    enabled,
    ready: false,
    oidcConfigured,
    securityApproved,
    homeserverUrl,
    reason:
      configured && enabled && oidcConfigured && securityApproved
        ? 'Homeserver reachability has not been verified.'
        : configured
          ? 'Private messaging is awaiting security and interoperability approval.'
          : 'Private messaging infrastructure is not configured.',
    reachable: false,
    supportedVersions: [],
  }
}

export async function probeMatrixHomeserver(): Promise<MatrixCapabilityStatus> {
  const status = getMatrixCapabilityStatus()
  if (!status.homeserverUrl) return status

  try {
    const response = await fetch(
      `${status.homeserverUrl.replace(/\/$/, '')}/_matrix/client/versions`,
      { signal: AbortSignal.timeout(3000), cache: 'no-store' }
    )
    if (!response.ok) return { ...status, reason: 'Matrix homeserver health check failed.' }
    const payload = (await response.json()) as { versions?: unknown }
    const supportedVersions = Array.isArray(payload.versions)
      ? payload.versions.filter((version): version is string => typeof version === 'string')
      : []
    const ready =
      status.configured &&
      status.enabled &&
      status.oidcConfigured &&
      status.securityApproved &&
      supportedVersions.length > 0
    return {
      ...status,
      ready,
      reachable: true,
      supportedVersions,
      reason: ready ? null : status.reason,
    }
  } catch {
    return { ...status, reason: 'Matrix homeserver is unreachable.' }
  }
}
