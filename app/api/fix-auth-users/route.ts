import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    console.log('Fixing auth users after UUID migration...')
    
    // Get all users
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({ limit: 1000 })
    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    console.log(`Found ${users.users.length} users to fix`)

    const results = []
    const testPassword = 'password123456'

    for (const user of users.users) {
      try {
        console.log(`Fixing user: ${user.email} (ID: ${user.id})`)
        
        // Check if user has a valid UUID
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
        
        if (!isValidUUID) {
          console.log(`⚠️ User ${user.email} has invalid UUID: ${user.id}`)
          results.push({
            email: user.email,
            id: user.id,
            success: false,
            error: 'Invalid UUID format',
            action: 'skip'
          })
          continue
        }

        // Try to update the user with a password and confirm email
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: testPassword,
          email_confirm: true
        })
        
        if (updateError) {
          console.error(`Failed to fix user ${user.email}:`, updateError)
          results.push({
            email: user.email,
            id: user.id,
            success: false,
            error: updateError.message,
            action: 'update_failed'
          })
        } else {
          console.log(`✅ Successfully fixed user: ${user.email}`)
          results.push({
            email: user.email,
            id: user.id,
            success: true,
            action: 'updated'
          })
        }
      } catch (error: any) {
        console.error(`Error fixing user ${user.email}:`, error)
        results.push({
          email: user.email,
          id: user.id,
          success: false,
          error: error.message,
          action: 'error'
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`Auth fix complete: ${successful} successful, ${failed} failed`)

    return NextResponse.json({ 
      success: true,
      message: `Fixed ${successful} users successfully. ${failed} failed.`,
      results,
      summary: {
        total: users.users.length,
        successful,
        failed
      },
      testCredentials: {
        password: testPassword,
        note: 'All fixed users now have this password'
      }
    })

  } catch (error: any) {
    console.error('Fix auth users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 