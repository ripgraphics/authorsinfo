/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST, PATCH } from '@/app/api/internal/notifications/push/route'

const mockRpc = jest.fn()
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ rpc: mockRpc })),
}))

const jobId = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  process.env.MESSAGING_PUSH_WORKER_SECRET = 'worker-secret'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  process.env.MESSAGING_PUSH_PROVIDER_URL = 'https://push.example.test/deliver'
  mockRpc.mockReset()
  global.fetch = jest.fn()
})

function request(body: unknown, secret = 'worker-secret') {
  return new NextRequest('http://localhost/api/internal/notifications/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-messaging-worker-secret': secret },
    body: JSON.stringify(body),
  })
}

test('claims push jobs only with the worker secret', async () => {
  mockRpc.mockResolvedValue({ data: [], error: null })
  expect((await POST(request({ limit: 10 }, 'wrong-secret'))).status).toBe(401)

  const response = await POST(request({ limit: 10 }))
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ jobs: [], results: [] })
  expect(mockRpc).toHaveBeenCalledWith('claim_notification_push_jobs', { p_limit: 10 })
})

test('delivers claimed jobs and completes them after provider success', async () => {
  mockRpc.mockResolvedValueOnce({
    data: [{
      id: jobId,
      subscription_id: '22222222-2222-4222-8222-222222222222',
      endpoint: 'https://push.example.test/subscription',
      auth_key: 'auth',
      p256dh_key: 'p256dh',
      device_type: 'web',
      payload: { title: 'New message' },
      attempt_count: 1,
    }],
    error: null,
  }).mockResolvedValueOnce({ data: null, error: null })
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 202, text: async () => '' })

  const response = await POST(request({ limit: 1 }))

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ jobs: expect.any(Array), results: [{ id: jobId, succeeded: true }] })
  expect(global.fetch).toHaveBeenCalledWith('https://push.example.test/deliver', expect.objectContaining({ method: 'POST' }))
  expect(mockRpc).toHaveBeenLastCalledWith('complete_notification_push_job', {
    p_job_id: jobId,
    p_succeeded: true,
    p_error: null,
    p_retry_seconds: 300,
  })
})

test('marks provider failures as retryable jobs', async () => {
  mockRpc.mockResolvedValueOnce({
    data: [{
      id: jobId,
      subscription_id: '22222222-2222-4222-8222-222222222222',
      endpoint: 'https://push.example.test/subscription',
      auth_key: 'auth',
      p256dh_key: 'p256dh',
      device_type: 'web',
      payload: { title: 'New message' },
      attempt_count: 1,
    }],
    error: null,
  }).mockResolvedValueOnce({ data: null, error: null })
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status: 503,
    text: async () => 'provider unavailable',
  })

  const response = await POST(request({ limit: 1 }))

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ jobs: expect.any(Array), results: [{ id: jobId, succeeded: false }] })
  expect(mockRpc).toHaveBeenLastCalledWith('complete_notification_push_job', {
    p_job_id: jobId,
    p_succeeded: false,
    p_error: 'provider unavailable',
    p_retry_seconds: 300,
  })
})

test('completes a push job through the worker contract', async () => {
  mockRpc.mockResolvedValue({ data: null, error: null })
  const response = await PATCH(new NextRequest('http://localhost/api/internal/notifications/push', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-messaging-worker-secret': 'worker-secret' },
    body: JSON.stringify({ job_id: jobId, succeeded: false, error: 'provider unavailable' }),
  }))

  expect(response.status).toBe(200)
  expect(mockRpc).toHaveBeenCalledWith('complete_notification_push_job', {
    p_job_id: jobId,
    p_succeeded: false,
    p_error: 'provider unavailable',
    p_retry_seconds: 300,
  })
})
