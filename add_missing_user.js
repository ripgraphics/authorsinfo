const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingUser() {
  console.log('🔍 Checking for existing users...')
  
  try {
    // First, let's see what users exist
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, permalink')
      .limit(5)
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError)
      return
    }
    
    console.log(`📊 Found ${existingUsers.length} existing users:`)
    existingUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ID: ${user.id}`)
    })
    
    // Check if our target user already exists
    const targetUserId = 'b474d5f5-cbf2-49af-8d03-2ca4aea11081'
    const existingUser = existingUsers.find(u => u.id === targetUserId)
    
    if (existingUser) {
      console.log('✅ User already exists!')
      console.log(`   • Name: ${existingUser.name}`)
      console.log(`   • Email: ${existingUser.email}`)
      console.log(`   • ID: ${existingUser.id}`)
      console.log(`   • Permalink: ${existingUser.permalink}`)
      console.log('\n🌐 You can now visit: http://localhost:3034/profile/b474d5f5-cbf2-49af-8d03-2ca4aea11081')
      return
    }
    
    console.log('\n📝 Adding missing test user...')
    
    // Create the missing user
    const testUser = {
      id: targetUserId,
      name: 'Test User',
      email: 'test@authorsinfo.com',
      permalink: 'test-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
    
    if (insertError) {
      console.error('❌ Error creating test user:', insertError)
      return
    }
    
    console.log('✅ Test user created successfully!')
    console.log(`   • Name: ${newUser[0].name}`)
    console.log(`   • Email: ${newUser[0].email}`)
    console.log(`   • ID: ${newUser[0].id}`)
    console.log(`   • Permalink: ${newUser[0].permalink}`)
    console.log('\n🌐 You can now visit: http://localhost:3034/profile/b474d5f5-cbf2-49af-8d03-2ca4aea11081')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addMissingUser() 