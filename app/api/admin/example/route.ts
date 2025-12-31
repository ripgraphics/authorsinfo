import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Verify permission
    await requirePermission('manage:users')

    // ... existing logic to fetch users ...
    return NextResponse.json({ message: 'Admin access granted' })
  } catch (error: any) {
    logger.warn({ err: error }, 'Unauthorized access attempt to admin API')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}

