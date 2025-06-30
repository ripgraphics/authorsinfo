import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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
          role
        `)
        .eq('user_id', userId)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }
      
      const transformedUser = {
        id: user.id,
        email: user.email || 'No email',
        name: user.name || 'Unknown User',
        created_at: user.created_at,
        role: profile?.role || 'user'
      }
      
      return NextResponse.json({ user: transformedUser })
    }
    
    // Get all users from the public.users table
    const { data: users, error: usersError } = await supabase
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
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
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
    
    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error('Error in auth-users route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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
        role_id
      `)
      .eq('id', session.user.id)
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
        role
      `)
      .eq('user_id', session.user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
    }
    
    const transformedUser = {
      id: user.id,
      email: user.email || 'No email',
      name: user.name || 'Unknown User',
      created_at: user.created_at,
      role: profile?.role || 'user'
    }
    
    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Error in auth-users POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 