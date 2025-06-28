import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    console.log('🔍 Fetching auth users...')
    
    // Fetch all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({ limit: 1000 })
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
    }
    
    console.log(`✅ Found ${authUsers.users.length} auth users`)
    
    // Check existing public users to avoid duplicates
    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
    
    if (existingError) {
      console.error('❌ Error checking existing users:', existingError.message)
      return NextResponse.json({ error: 'Failed to check existing users' }, { status: 500 })
    }
    
    const existingUserIds = new Set(existingUsers.map(u => u.id))
    console.log(`📊 Found ${existingUsers.length} existing public users`)
    
    // Filter out users that already exist in public.users
    const newUsers = authUsers.users.filter(user => !existingUserIds.has(user.id))
    
    if (newUsers.length === 0) {
      return NextResponse.json({ 
        message: 'All auth users already exist in public.users table',
        totalAuthUsers: authUsers.users.length,
        existingPublicUsers: existingUsers.length,
        newUsersAdded: 0
      })
    }
    
    console.log(`🆕 Found ${newUsers.length} new users to add`)
    
    // Prepare user data for insertion
    const usersToInsert = newUsers.map(user => {
      const userMetadata = user.user_metadata || {}
      const name = userMetadata.full_name || 
                   userMetadata.name || 
                   `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim() ||
                   user.email?.split('@')[0] || 
                   'User'
      
      return {
        id: user.id,
        email: user.email,
        name: name,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        role_id: null // You can set a default role_id if needed
      }
    })
    
    // Insert users into public.users table
    console.log('📝 Inserting users into public.users table...')
    const { data: insertedUsers, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(usersToInsert)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting users:', insertError.message)
      return NextResponse.json({ error: 'Failed to insert users' }, { status: 500 })
    }
    
    console.log(`✅ Successfully inserted ${insertedUsers.length} users into public.users table`)
    
    // Now create profiles for these users
    console.log('📝 Creating profiles for users...')
    
    const profilesToInsert = insertedUsers.map(user => ({
      user_id: user.id,
      bio: null, // You can set a default bio if needed
      created_at: user.created_at,
      updated_at: user.updated_at
    }))
    
    const { data: insertedProfiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profilesToInsert)
      .select()
    
    if (profileError) {
      console.error('❌ Error inserting profiles:', profileError.message)
      return NextResponse.json({ error: 'Failed to insert profiles' }, { status: 500 })
    }
    
    console.log(`✅ Successfully created ${insertedProfiles.length} profiles`)
    
    // Summary
    const summary = {
      totalAuthUsers: authUsers.users.length,
      existingPublicUsers: existingUsers.length,
      newUsersAdded: insertedUsers.length,
      profilesCreated: insertedProfiles.length,
      examples: insertedUsers.slice(0, 5).map(user => ({
        name: user.name,
        email: user.email
      }))
    }
    
    console.log('\n📊 Summary:', summary)
    console.log('\n🎉 Public users table population completed!')
    
    return NextResponse.json({
      message: 'Public users table population completed successfully',
      ...summary
    })
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
} 