import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    console.log('Resetting password for existing user...')
    
    // Get the first user from the list
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({ limit: 1 })
    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users.users || users.users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    const user = users.users[0]
    const testPassword = 'password123'
    
    console.log(`Resetting password for user: ${user.email} (ID: ${user.id})`)
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: testPassword,
      email_confirm: true
    })
    
    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user',
        details: updateError.message 
      }, { status: 500 })
    }
    
    console.log(`✅ Successfully reset password for ${user.email}`)
    
    return NextResponse.json({ 
      success: true,
      message: `Reset password for user: ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      credentials: {
        email: user.email,
        password: testPassword
      }
    })

  } catch (error: any) {
    console.error('Reset single user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 