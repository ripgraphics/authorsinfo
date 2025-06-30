const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetAllPasswords() {
  try {
    console.log('Fetching all users...')
    
    // Get all users
    const { data, error } = await supabase.auth.admin.listUsers({ limit: 1000 })
    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    const users = data?.users || []
    console.log(`Found ${users.length} users`)

    if (users.length === 0) {
      console.log('No users found to reset passwords for')
      return
    }

    const newPassword = 'password123'
    console.log(`Resetting all ${users.length} user passwords to: ${newPassword}`)

    const results = []
    for (const user of users) {
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { 
          password: newPassword 
        })
        
        if (updateError) {
          console.error(`Failed to reset password for ${user.email}:`, updateError.message)
          results.push({ 
            id: user.id, 
            email: user.email, 
            success: false, 
            error: updateError.message 
          })
        } else {
          console.log(`✅ Reset password for: ${user.email}`)
          results.push({ 
            id: user.id, 
            email: user.email, 
            success: true 
          })
        }
      } catch (error) {
        console.error(`Error resetting password for ${user.email}:`, error)
        results.push({ 
          id: user.id, 
          email: user.email, 
          success: false, 
          error: error.message 
        })
      }
    }

    // Summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log('\n=== SUMMARY ===')
    console.log(`Total users: ${users.length}`)
    console.log(`Successful resets: ${successful}`)
    console.log(`Failed resets: ${failed}`)
    
    if (failed > 0) {
      console.log('\nFailed resets:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.email}: ${r.error}`)
      })
    }

    console.log('\n=== LOGIN CREDENTIALS ===')
    console.log('All users now have the password: password123')
    console.log('You can now test login with any user email and password: password123')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

resetAllPasswords() 