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
    const commentId: string | undefined = body?.comment_id
    if (!commentId) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 })
    }

    // Record the hide action in activity_log for idempotency and filtering
    const { data: existing } = await supabase
      .from('activity_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('action', 'hide_comment')
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .maybeSingle()

    if (!existing) {
      const { error: insertError } = await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          action: 'hide_comment',
          target_type: 'comment',
          target_id: commentId
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}


