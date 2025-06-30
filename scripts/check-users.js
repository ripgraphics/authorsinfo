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

async function checkUsers() {
  try {
    console.log('Checking users in Supabase Auth...')
    console.log('Supabase URL:', supabaseUrl)
    
    const { data, error } = await supabase.auth.admin.listUsers({ limit: 100 })
    
    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    const users = data?.users || []
    console.log(`Found ${users.length} users:`)
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`)
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   User Metadata:`, user.user_metadata)
    })

    if (users.length === 0) {
      console.log('\nNo users found. You may need to create some test users.')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkUsers() 