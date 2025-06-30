import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  return await createTestUser()
}

export async function POST() {
  return await createTestUser()
}

async function createTestUser() {
  try {
    console.log('Creating a fresh test user...')
    
    const testEmail = 'testuser@authorsinfo.com'
    const testPassword = 'password123'
    
    // First, check if user already exists
    const { data: existingUsers, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({ limit: 1000 })
    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const existingUser = existingUsers.users.find(u => u.email === testEmail)
    if (existingUser) {
      console.log(`User ${testEmail} already exists. Updating password...`)
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: testPassword,
        email_confirm: true
      })
      
      if (updateError) {
        console.error('Error updating user:', updateError)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
      }
      
      console.log(`✅ Successfully updated password for ${testEmail}`)
      
      return NextResponse.json({ 
        success: true,
        message: `Updated password for existing user: ${testEmail}`,
        credentials: {
          email: testEmail,
          password: testPassword
        }
      })
    } else {
      console.log(`Creating new user: ${testEmail}`)
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Test User',
          full_name: 'Test User'
        }
      })
      
      if (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      
      console.log(`✅ Successfully created user: ${testEmail}`)
      console.log('User ID:', data.user.id)
      
      return NextResponse.json({ 
        success: true,
        message: `Created new user: ${testEmail}`,
        userId: data.user.id,
        credentials: {
          email: testEmail,
          password: testPassword
        }
      })
    }

  } catch (error: any) {
    console.error('Create test user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 