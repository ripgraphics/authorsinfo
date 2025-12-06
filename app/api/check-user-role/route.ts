import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
    }

    console.log(`🔍 Checking role for user: ${userId}`)

    // Note: auth.users table doesn't exist in current schema, using public.profiles instead

    // Check public.profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        user_id,
        role,
        created_at
      `)
      .eq('user_id', userId)
      .single()

    console.log('Profile data:', { profile, error: profileError?.message })

    // Check public.users table
    const { data: publicUser, error: publicUserError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role_id,
        created_at
      `)
      .eq('id', userId)
      .single()

    console.log('Public user data:', { publicUser, error: publicUserError?.message })

    // Get the role name from the roles table
    let roleName = null
    if (publicUser && publicUser.role_id) {
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select(`
          id,
          name,
          description
        `)
        .eq('id', publicUser.role_id)
        .single()

      if (!roleError && roleData) {
        roleName = roleData.name
        console.log('Role data:', roleData)
      } else {
        console.log('Role error:', roleError?.message)
      }
    }

    // Determine the effective role
    let effectiveRole = 'user'
    let roleSource = 'default'

    // Check public.profiles table first
    if (!profileError && profile && profile.role) {
      effectiveRole = profile.role
      roleSource = 'public.profiles.role'
    }

    // Check role from roles table if still default
    if (effectiveRole === 'user' && roleName) {
      effectiveRole = roleName
      roleSource = 'public.roles.name'
    }

    const result = {
      userId,
      effectiveRole,
      roleSource,
      roleName,
      authUser: null, // auth.users table doesn't exist in current schema
      profile: profileError ? null : profile,
      publicUser: publicUserError ? null : publicUser,
      errors: {
        authUserError: null, // auth.users table doesn't exist in current schema
        profileError: profileError?.message,
        publicUserError: publicUserError?.message
      }
    }

    console.log('Final result:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 