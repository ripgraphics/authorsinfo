import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get current user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user already exists in public.users table
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json({ error: 'Failed to check existing user' }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({
        message: 'User already exists in public.users table',
        user: existingUser,
      })
    }

    // Create user in public.users table
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users' as any)
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user in public.users table' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User created successfully in public.users table',
      user: newUser,
    })
  } catch (error) {
    console.error('Error in create-test-user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
