import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    console.log('Checking users...')

    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 10,
    })
    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users.users || users.users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    const userInfo = users.users.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      phone: user.phone,
      has_password: !!(user as any).encrypted_password,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    }))

    console.log(`Found ${users.users.length} users`)

    return NextResponse.json({
      success: true,
      totalUsers: users.users.length,
      users: userInfo,
    })
  } catch (error: any) {
    console.error('Check users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
