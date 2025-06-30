const { createClient } = require('@supabase/supabase-js')

// Get environment variables from .env.local
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

async function createFreshUser() {
  try {
    console.log('Creating a fresh test user...')
    
    const testEmail = 'testuser@authorsinfo.com'
    const testPassword = 'password123'
    
    // First, check if user already exists
    const { data: existingUsers, error: fetchError } = await supabase.auth.admin.listUsers({ limit: 1000 })
    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return
    }

    const existingUser = existingUsers.users.find(u => u.email === testEmail)
    if (existingUser) {
      console.log(`User ${testEmail} already exists. Updating password...`)
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: testPassword,
        email_confirm: true
      })
      
      if (updateError) {
        console.error('Error updating user:', updateError)
        return
      }
      
      console.log(`✅ Successfully updated password for ${testEmail}`)
    } else {
      console.log(`Creating new user: ${testEmail}`)
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Test User',
          full_name: 'Test User'
        }
      })
      
      if (error) {
        console.error('Error creating user:', error)
        return
      }
      
      console.log(`✅ Successfully created user: ${testEmail}`)
      console.log('User ID:', data.user.id)
    }

    console.log('\n=== TEST CREDENTIALS ===')
    console.log('Email:', testEmail)
    console.log('Password:', testPassword)
    console.log('\nYou can now test login with these credentials!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createFreshUser() 