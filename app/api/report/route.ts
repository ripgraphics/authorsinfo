import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import {
  handleDatabaseError,
  nextErrorResponse,
  badRequestError,
  unauthorizedError,
} from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    const body = await request.json()
    const targetType: string | undefined = body?.target_type
    const targetId: string | undefined = body?.target_id
    const reason: string | undefined = body?.reason || 'user_report'
    if (!targetType || !targetId) {
      return NextResponse.json(badRequestError('target_type and target_id are required'), {
        status: 400,
      })
    }

    // Use activity_log as generic reporting sink if group_reports not applicable
    const { error: insertError } = await (supabase.from('activity_log') as any).insert({
      user_id: user.id,
      action: 'report',
      target_type: targetType,
      target_id: targetId,
      data: { reason },
    })

    if (insertError) {
      const { message, statusCode } = handleDatabaseError(insertError, 'Failed to submit report')
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to submit report')
  }
}

