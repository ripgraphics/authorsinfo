import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    console.log(`Testing login for: ${email}`)

    // First, check if the user exists
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({ limit: 1000 })
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        userExists: false 
      }, { status: 404 })
    }

    console.log(`User found: ${user.email} (ID: ${user.id})`)

    // Try to sign in with the provided credentials
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'http://localhost:3000'
      }
    })

    if (error) {
      console.error('Error generating magic link:', error)
      return NextResponse.json({ 
        error: 'Failed to test login',
        details: error.message,
        userExists: true,
        canLogin: false
      }, { status: 500 })
    }

    // For now, just return user info since we can't directly test password
    return NextResponse.json({ 
      success: true,
      userExists: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at
      },
      message: 'User exists and can receive magic links'
    })

  } catch (error: any) {
    console.error('Test login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 