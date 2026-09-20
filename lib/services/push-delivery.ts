export interface PushDeliveryJob {
  id: string
  subscription_id: string
  endpoint: string
  auth_key: string | null
  p256dh_key: string | null
  device_type: string | null
  payload: Record<string, unknown>
  attempt_count: number
}

export interface PushDeliveryResult {
  succeeded: boolean
  error?: string
  retrySeconds?: number
}

const DEFAULT_TIMEOUT_MS = 10_000

function providerUrl(): string | null {
  const value = process.env.MESSAGING_PUSH_PROVIDER_URL?.trim()
  return value ? value : null
}

export function isPushDeliveryConfigured(): boolean {
  return providerUrl() !== null
}

export async function deliverPushJob(job: PushDeliveryJob): Promise<PushDeliveryResult> {
  const url = providerUrl()
  if (!url) {
    return { succeeded: false, error: 'Push delivery provider is not configured', retrySeconds: 3600 }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.MESSAGING_PUSH_PROVIDER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.MESSAGING_PUSH_PROVIDER_TOKEN
          ? { Authorization: `Bearer ${process.env.MESSAGING_PUSH_PROVIDER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        job_id: job.id,
        subscription: {
          endpoint: job.endpoint,
          auth: job.auth_key,
          p256dh: job.p256dh_key,
          device_type: job.device_type,
        },
        payload: job.payload,
      }),
      signal: controller.signal,
    })

    if (response.ok) return { succeeded: true }

    const responseText = (await response.text()).trim()
    return {
      succeeded: false,
      error: responseText.slice(0, 1000) || `Push provider returned HTTP ${response.status}`,
      retrySeconds: response.status >= 400 && response.status < 500 && response.status !== 429 ? 86400 : 300,
    }
  } catch (error) {
    return {
      succeeded: false,
      error: error instanceof Error ? error.message.slice(0, 1000) : 'Push provider request failed',
      retrySeconds: 300,
    }
  } finally {
    clearTimeout(timeout)
  }
}