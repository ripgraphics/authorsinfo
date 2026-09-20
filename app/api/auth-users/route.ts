import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/auth/require-auth'

// Cache duration for user data (5 minutes)
const CACHE_DURATION = 300

async function getUserWithRetry(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClientAsync>>
) {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await supabase.auth.getUser()
      if (!result.error || result.data.user) return result
      lastError = result.error
      const status = (result.error as { status?: number }).status
      if (status !== undefined && status < 500) return result
    } catch (error) {
      lastError = error
    }
  }
  return { data: { user: null }, error: lastError }
}

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

    // Reuse the app auth boundary, including its local-session recovery path.
    const authentication = await requireUser()
    const user = authentication.ok ? authentication.context.user : null
    const userError = authentication.ok ? null : new Error('No authenticated user')

    // If there's an error OR no user, return 401 (not logged in)
    // This handles both cases: errors during auth check and simply no user
    if (userError || !user) {
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

    if (userDataError) console.warn('User profile enrichment unavailable:', userDataError)

    const safeUserData = (userData as {
      id?: string
      email?: string | null
      name?: string | null
      created_at?: string | null
      permalink?: string | null
    } | null) ?? {
      id: user.id,
      email: user.email ?? null,
      name: (user.user_metadata?.name as string | undefined) ?? user.email ?? null,
      created_at: user.created_at ?? null,
      permalink: null,
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
      id: safeUserData.id ?? user.id,
      email: safeUserData.email || user.email || 'No email',
      name: safeUserData.name || user.email || 'Unknown User',
      created_at: safeUserData.created_at,
      role: userRole,
      permalink: safeUserData.permalink,
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
