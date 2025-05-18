import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Fetch up to 100 users from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ limit: 100 })
    if (error) {
      console.error('Error fetching auth users:', error)
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
    }
    const users = (data?.users || []).map((user) => ({
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      id: user.id,
    }))
    return NextResponse.json(users)
  } catch (error) {
    console.error('Unexpected error fetching auth users:', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
} 