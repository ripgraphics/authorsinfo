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

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        name: 'Test User'
      }
    })

    if (error) {
      console.error('Error creating user:', error)
      return
    }

    console.log('Test user created successfully!')
    console.log('Email: test@example.com')
    console.log('Password: password123')
    console.log('User ID:', data.user.id)
    
    // Also create a profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: 'testuser',
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      })

    if (profileError) {
      console.log('Note: Could not create profile record:', profileError.message)
    } else {
      console.log('Profile record created successfully!')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestUser() 