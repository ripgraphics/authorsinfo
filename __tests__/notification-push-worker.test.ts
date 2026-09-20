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
  mockRpc.mockReset()
})

function request(body: unknown, secret = 'worker-secret') {
  return new NextRequest('http://localhost/api/internal/notifications/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-messaging-worker-secret': secret },
    body: JSON.stringify(body),
  })
}

test('claims push jobs only with the worker secret', async () => {
  mockRpc.mockResolvedValue({ data: [{ id: jobId }], error: null })
  expect((await POST(request({ limit: 10 }, 'wrong-secret'))).status).toBe(401)

  const response = await POST(request({ limit: 10 }))
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ jobs: [{ id: jobId }] })
  expect(mockRpc).toHaveBeenCalledWith('claim_notification_push_jobs', { p_limit: 10 })
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
