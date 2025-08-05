const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSpecificUser() {
  const targetUserId = 'b474d5f5-cbf2-49af-8d03-2ca4aea11081'
  
  console.log(`🔍 Checking for user with ID: ${targetUserId}`)
  
  try {
    // Try to find the specific user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single()
    
    if (error) {
      console.error('❌ Error fetching user:', error)
      return
    }
    
    if (user) {
      console.log('✅ User found!')
      console.log('User data:', JSON.stringify(user, null, 2))
    } else {
      console.log('❌ User not found')
    }
    
    // Also check by permalink
    console.log('\n🔍 Checking by permalink: test-user')
    const { data: userByPermalink, error: permalinkError } = await supabase
      .from('users')
      .select('*')
      .eq('permalink', 'test-user')
      .single()
    
    if (permalinkError) {
      console.error('❌ Error fetching user by permalink:', permalinkError)
    } else if (userByPermalink) {
      console.log('✅ User found by permalink!')
      console.log('User data:', JSON.stringify(userByPermalink, null, 2))
    } else {
      console.log('❌ User not found by permalink')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkSpecificUser() 