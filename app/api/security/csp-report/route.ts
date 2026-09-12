import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const report = await request.json()
    logger.warn(
      {
        blockedUri: typeof report?.['csp-report']?.['blocked-uri'] === 'string'
          ? report['csp-report']['blocked-uri'].slice(0, 256)
          : undefined,
        violatedDirective: typeof report?.['csp-report']?.['violated-directive'] === 'string'
          ? report['csp-report']['violated-directive'].slice(0, 256)
          : undefined,
      },
      'Content Security Policy violation'
    )
  } catch {
    // Browsers may send malformed reports; never turn reporting into an outage.
  }

  return new NextResponse(null, { status: 204 })
}
