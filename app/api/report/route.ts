import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const targetType: string | undefined = body?.target_type
    const targetId: string | undefined = body?.target_id
    const reason: string | undefined = body?.reason || 'user_report'
    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 })
    }

    // Use activity_log as generic reporting sink if group_reports not applicable
    const { error: insertError } = await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        action: 'report',
        target_type: targetType,
        target_id: targetId,
        data: { reason }
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}


