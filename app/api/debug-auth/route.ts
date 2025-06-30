import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    console.log('Debugging Supabase Auth system...')
    
    // Check if we can access auth at all
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({ limit: 5 })
    
    if (fetchError) {
      console.error('Error accessing auth:', fetchError)
      return NextResponse.json({ 
        error: 'Cannot access Supabase Auth',
        details: fetchError.message,
        code: fetchError.status
      }, { status: 500 })
    }

    console.log(`Successfully accessed auth. Found ${users.users.length} users`)

    // Check each user's details
    const userDetails = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      banned_until: user.banned_until,
      reauthentication_sent_at: user.reauthentication_sent_at,
      recovery_sent_at: user.recovery_sent_at,
      email_change_sent_at: user.email_change_sent_at,
      phone_change_sent_at: user.phone_change_sent_at,
      confirmation_sent_at: user.confirmation_sent_at,
      has_password: !!user.encrypted_password,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      // Check if ID is valid UUID
      is_valid_uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
    }))

    // Try to get auth settings
    let authSettings = null
    try {
      const { data: settings, error: settingsError } = await supabaseAdmin.auth.admin.listUsers({ limit: 1 })
      if (!settingsError) {
        authSettings = 'Auth system accessible'
      }
    } catch (error) {
      authSettings = `Error: ${error}`
    }

    return NextResponse.json({ 
      success: true,
      authSystemStatus: 'Accessible',
      totalUsers: users.users.length,
      users: userDetails,
      authSettings,
      recommendations: [
        'If users have invalid UUIDs, you may need to recreate them',
        'If auth system is corrupted, you may need to reset Supabase Auth',
        'Check if the UUID migration affected the auth schema'
      ]
    })

  } catch (error: any) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      error: 'Failed to debug auth system',
      details: error.message 
    }, { status: 500 })
  }
} 