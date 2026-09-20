import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { nextErrorResponse } from '@/lib/error-handler'
import { deliverPushJob, isPushDeliveryConfigured, type PushDeliveryJob } from '@/lib/services/push-delivery'

const requestSchema = z.object({ limit: z.number().int().min(1).max(200).optional() }).strict()
const completionSchema = z.object({
  job_id: z.string().uuid(),
  succeeded: z.boolean(),
  error: z.string().trim().max(1000).optional(),
  retry_seconds: z.number().int().min(30).max(86400).optional(),
}).strict()

function authorized(request: NextRequest): boolean {
  const configuredSecret = process.env.MESSAGING_PUSH_WORKER_SECRET || process.env.CRON_SECRET
  const suppliedSecret = request.headers.get('x-messaging-worker-secret')
  return Boolean(configuredSecret && suppliedSecret && suppliedSecret === configuredSecret)
}

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const input = requestSchema.safeParse(await request.json().catch(() => ({})))
    if (!input.success) return NextResponse.json({ error: 'Invalid worker request' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: 'Push worker is not configured' }, { status: 503 })
    }
    if (!isPushDeliveryConfigured()) {
      return NextResponse.json({ error: 'Push delivery provider is not configured' }, { status: 503 })
    }

    const supabase = createClient(url, serviceRoleKey)
    const { data, error } = await supabase.rpc('claim_notification_push_jobs', {
      p_limit: input.data.limit ?? 50,
    })
    if (error) throw error

    const jobs = (data ?? []) as PushDeliveryJob[]
    const results = await Promise.all(jobs.map(async (job) => {
      const result = await deliverPushJob(job)
      const { error: completionError } = await supabase.rpc('complete_notification_push_job', {
        p_job_id: job.id,
        p_succeeded: result.succeeded,
        p_error: result.error ?? null,
        p_retry_seconds: result.retrySeconds ?? 300,
      })
      if (completionError) throw completionError
      return { id: job.id, succeeded: result.succeeded }
    }))

    return NextResponse.json({ jobs, results }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to claim push jobs', 500, false)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const input = completionSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) return NextResponse.json({ error: 'Invalid completion request' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: 'Push worker is not configured' }, { status: 503 })
    }

    const supabase = createClient(url, serviceRoleKey)
    const { error } = await supabase.rpc('complete_notification_push_job', {
      p_job_id: input.data.job_id,
      p_succeeded: input.data.succeeded,
      p_error: input.data.error ?? null,
      p_retry_seconds: input.data.retry_seconds ?? 300,
    })
    if (error) throw error

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to complete push job', 500, false)
  }
}
