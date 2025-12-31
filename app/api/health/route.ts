import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function GET() {
  const startTime = Date.now()

  try {
    // Check Database Connection
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('count').limit(1).single()

    if (error) {
      throw error
    }

    const duration = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        latency: `${duration}ms`,
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error({ err: error }, 'Health check failed')

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    )
  }
}

