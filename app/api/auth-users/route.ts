import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Cache duration for user data (5 minutes)
const CACHE_DURATION = 300

export async function GET(request: Request) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    // Use admin client for fetching all users
    const adminSupabase = supabaseAdmin

    // Check if we're looking for a specific user
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (userId) {
      // Get specific user using admin client so public requests can read profiles
      const { data: user, error: userError } = await adminSupabase
        .from('users')
        .select(
          `
          id,
          email,
          name,
          created_at,
          updated_at,
          role_id
        `
        )
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user:', userError)
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
      }

      // Get profile for this user using admin client
      const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select(
          `
          id,
          user_id,
          bio,
          role,
          avatar_image_id
        `
        )
        .eq('user_id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      // Fetch avatar from images table via profiles.avatar_image_id
      let avatarUrl: string | null = null
      if ((profile as any)?.avatar_image_id) {
        try {
          const { data: image } = await adminSupabase
            .from('images')
            .select('url')
            .eq('id', (profile as any).avatar_image_id)
            .single()

          if ((image as any)?.url) {
            avatarUrl = (image as any).url
          }
        } catch (avatarError) {
          // Non-fatal; avatar will be null if not found
          console.log('Avatar not found or error fetching:', avatarError)
        }
      }

      const transformedUser = {
        id: (user as any).id,
        email: (user as any).email || 'No email',
        name: (user as any).name || 'Unknown User',
        created_at: (user as any).created_at,
        role: (profile as any)?.role || 'user',
        avatar_url: avatarUrl,
      }

      const response = NextResponse.json({ user: transformedUser })
      response.headers.set('Cache-Control', `public, max-age=${CACHE_DURATION}`)
      return response
    }

    // Get all users from the public.users table using admin client
    console.log('🔍 Fetching users from public.users table...')
    const { data: users, error: usersError } = await adminSupabase
      .from('users')
      .select(
        `
        id,
        email,
        name,
        created_at,
        updated_at,
        role_id
      `
      )
      .order('created_at', { ascending: false })

    console.log('📊 Users query result:', {
      usersCount: users?.length || 0,
      error: usersError?.message || null,
    })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get all profiles using admin client
    const { data: profiles, error: profilesError } = await adminSupabase.from('profiles').select(`
        id,
        user_id,
        bio,
        role
      `)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Create a map of user_id to profile
    const profileMap = new Map()
    profiles?.forEach((profile: any) => {
      profileMap.set(profile.user_id, profile)
    })

    // Transform the data to match the expected format
    const transformedUsers =
      (users as any[])?.map((user: any) => {
        const profile = profileMap.get(user.id)
        return {
          id: user.id,
          email: user.email || 'No email',
          name: user.name || 'Unknown User',
          created_at: user.created_at,
          role: (profile as any)?.role || 'user',
        }
      }) || []

    const response = NextResponse.json(transformedUsers)
    response.headers.set('Cache-Control', `public, max-age=${CACHE_DURATION}`)
    return response
  } catch (error) {
    console.error('Error in auth-users route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get current user - use getUser() to authenticate with Supabase Auth server
    let user = null
    let userError = null

    try {
      const result = await supabase.auth.getUser()
      user = result.data?.user || null
      userError = result.error || null
    } catch (error) {
      // Catch any unexpected errors from getUser()
      console.warn('Unexpected error calling getUser():', error)
      userError = error as any
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'auth-users/route.ts:156',
        message: 'getUser result',
        data: {
          hasUser: !!user,
          hasError: !!userError,
          errorName: userError?.name,
          errorMessage: userError?.message,
          errorConstructor: userError?.constructor?.name,
          errorString: String(userError),
          errorKeys: userError ? Object.keys(userError) : [],
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {})
    // #endregion

    // If there's an error OR no user, return 401 (not logged in)
    // This handles both cases: errors during auth check and simply no user
    if (userError || !user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'auth-users/route.ts:165',
          message: 'No user or error - returning 401',
          data: { hasError: !!userError, hasUser: !!user, errorMessage: userError?.message },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {})
      // #endregion
      // All authentication failures return 401 - this is expected for public users
      // Don't log as error unless it's a clear server/database issue
      if (
        userError &&
        !userError.message?.includes('session') &&
        !userError.message?.includes('JWT') &&
        !userError.message?.includes('token')
      ) {
        console.warn('Auth check issue (returning 401):', userError)
      }
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    if (!user) {
      // No authenticated user - this is normal for public users, don't log as error
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    // Get user data from users table
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        name,
        created_at,
        updated_at,
        role_id,
        permalink
      `
      )
      .eq('id', user.id)
      .single()

    if (userDataError) {
      console.error('Error fetching user:', userDataError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Get profile for role and avatar_image_id
    // Profile might not exist for all users - handle gracefully
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        user_id,
        role,
        avatar_image_id,
        created_at
      `
      )
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle() instead of single() - returns null if not found instead of error

    let userRole = 'user'
    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine - profile is optional
      console.error('Error fetching profile (non-fatal):', profileError)
    } else if (profile && (profile as any).role) {
      userRole = (profile as any).role
    }

    // Fetch avatar from images table via profiles.avatar_image_id
    let avatarUrl: string | null = null
    if ((profile as any)?.avatar_image_id) {
      try {
        const { data: image } = await supabase
          .from('images')
          .select('url')
          .eq('id', (profile as any).avatar_image_id)
          .single()

        if ((image as any)?.url) {
          avatarUrl = (image as any).url
        }
      } catch (avatarError) {
        // Non-fatal; avatar will be null if not found
        console.log('Avatar not found or error fetching:', avatarError)
      }
    }

    const transformedUser = {
      id: (userData as any).id,
      email: (userData as any).email || 'No email',
      name: (userData as any).name || 'Unknown User',
      created_at: (userData as any).created_at,
      role: userRole,
      permalink: (userData as any).permalink,
      avatar_url: avatarUrl,
    }

    const response = NextResponse.json({ user: transformedUser })
    response.headers.set('Cache-Control', `private, max-age=${CACHE_DURATION}`)
    return response
  } catch (error) {
    console.error('Error in auth-users POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
