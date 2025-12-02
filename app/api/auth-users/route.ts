import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Cache duration for user data (5 minutes)
const CACHE_DURATION = 300

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore })
    // Use admin client for fetching all users
    const adminSupabase = supabaseAdmin
    
    // Check if we're looking for a specific user
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (userId) {
      // Get specific user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          created_at,
          updated_at,
          role_id
        `)
        .eq('id', userId)
        .single()
      
      if (userError) {
        console.error('Error fetching user:', userError)
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
      }
      
      // Get profile for this user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          bio,
          role,
          avatar_image_id
        `)
        .eq('user_id', userId)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }
      
      // Fetch avatar from images table via profiles.avatar_image_id
      let avatarUrl: string | null = null
      if (profile?.avatar_image_id) {
        try {
          const { data: image } = await supabase
            .from('images')
            .select('url')
            .eq('id', profile.avatar_image_id)
            .single()
          
          if (image?.url) {
            avatarUrl = image.url
          }
        } catch (avatarError) {
          // Non-fatal; avatar will be null if not found
          console.log('Avatar not found or error fetching:', avatarError)
        }
      }
      
      const transformedUser = {
        id: user.id,
        email: user.email || 'No email',
        name: user.name || 'Unknown User',
        created_at: user.created_at,
        role: profile?.role || 'user',
        avatar_url: avatarUrl
      }
      
      const response = NextResponse.json({ user: transformedUser })
      response.headers.set('Cache-Control', `public, max-age=${CACHE_DURATION}`)
      return response
    }
    
    // Get all users from the public.users table using admin client
    console.log('🔍 Fetching users from public.users table...')
    const { data: users, error: usersError } = await adminSupabase
      .from('users')
      .select(`
        id,
        email,
        name,
        created_at,
        updated_at,
        role_id
      `)
      .order('created_at', { ascending: false })
    
    console.log('📊 Users query result:', { usersCount: users?.length || 0, error: usersError?.message || null })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    // Get all profiles using admin client
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select(`
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
    profiles?.forEach(profile => {
      profileMap.set(profile.user_id, profile)
    })
    
    // Transform the data to match the expected format
    const transformedUsers = users?.map(user => {
      const profile = profileMap.get(user.id)
      return {
        id: user.id,
        email: user.email || 'No email',
        name: user.name || 'Unknown User',
        created_at: user.created_at,
        role: profile?.role || 'user'
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
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore })
    
    // Get current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }
    
    // Get user data from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        created_at,
        updated_at,
        role_id,
        permalink
      `)
      .eq('id', session.user.id)
      .single()
    
    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }
      
    // Get profile for role and avatar_image_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          role,
        avatar_image_id,
          created_at
        `)
        .eq('user_id', session.user.id)
        .single()
      
      let userRole = 'user'
      if (!profileError && profile && profile.role) {
        userRole = profile.role
      }
      
    // Fetch avatar from images table via profiles.avatar_image_id
    let avatarUrl: string | null = null
    if (profile?.avatar_image_id) {
      try {
        const { data: image } = await supabase
          .from('images')
          .select('url')
          .eq('id', profile.avatar_image_id)
        .single()
      
        if (image?.url) {
          avatarUrl = image.url
        }
      } catch (avatarError) {
        // Non-fatal; avatar will be null if not found
        console.log('Avatar not found or error fetching:', avatarError)
      }
      }
      
      const transformedUser = {
        id: user.id,
        email: user.email || 'No email',
        name: user.name || 'Unknown User',
        created_at: user.created_at,
        role: userRole,
      permalink: user.permalink,
      avatar_url: avatarUrl
    }
    
    const response = NextResponse.json({ user: transformedUser })
    response.headers.set('Cache-Control', `private, max-age=${CACHE_DURATION}`)
    return response
  } catch (error) {
    console.error('Error in auth-users POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 