const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateUserPermalink() {
  const targetUserId = 'b474d5f5-cbf2-49af-8d03-2ca4aea11081'
  
  console.log(`🔧 Updating permalink for user: ${targetUserId}`)
  
  try {
    // Update the user's permalink
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        permalink: 'drew-dixon',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating user:', error)
      return
    }
    
    if (updatedUser) {
      console.log('✅ User updated successfully!')
      console.log('Updated user data:', JSON.stringify(updatedUser, null, 2))
      console.log('\n🌐 You can now visit:')
      console.log(`   • http://localhost:3034/profile/${targetUserId}`)
      console.log(`   • http://localhost:3034/profile/drew-dixon`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateUserPermalink() 