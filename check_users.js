const { createClient } = require('@supabase/supabase-js')

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  console.log('🔍 Checking existing users...')
  
  try {
    // Check what users exist
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, permalink')
      .limit(10)
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }
    
    console.log(`📊 Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ID: ${user.id}`)
    })
    
    if (users.length === 0) {
      console.log('\n📝 No users found. Creating a test user...')
      
      // Create a test user
      const testUser = {
        id: 'b474d5f5-cbf2-49af-8d03-2ca4aea11081', // The ID from the URL
        name: 'Test User',
        email: 'test@authorsinfo.com',
        permalink: 'test-user',
        created_at: new Date().toISOString()
      }
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(testUser)
        .select()
      
      if (insertError) {
        console.error('❌ Error creating test user:', insertError)
      } else {
        console.log('✅ Test user created successfully!')
        console.log(`   • Name: ${newUser[0].name}`)
        console.log(`   • Email: ${newUser[0].email}`)
        console.log(`   • ID: ${newUser[0].id}`)
        console.log(`   • Permalink: ${newUser[0].permalink}`)
        console.log('\n🌐 You can now visit: http://localhost:3034/profile/b474d5f5-cbf2-49af-8d03-2ca4aea11081')
      }
    } else {
      console.log('\n💡 To test the profile page, use one of the existing user IDs above')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUsers() 