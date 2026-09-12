import { NextResponse } from 'next/server'
import { probeMatrixHomeserver } from '@/lib/matrix-config'

export async function GET() {
  const status = await probeMatrixHomeserver()
  return NextResponse.json(
    {
      private_messaging: status,
      moderated_group_messaging: { configured: true, enabled: true, ready: true },
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
