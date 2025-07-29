const { createClient } = require('@supabase/supabase-js')

// Test script to verify enterprise tables exist
async function testDatabaseTables() {
  console.log('🔍 Testing Enterprise Database Tables...')
  
  // Create Supabase client (you may need to add your credentials)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Please check your .env.local file for:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const tablesToTest = [
    'photo_analytics',
    'photo_monetization', 
    'photo_community',
    'ai_image_analysis',
    'image_processing_jobs',
    'photo_albums',
    'album_images'
  ]
  
  console.log('\n📊 Testing table access...')
  
  for (const table of tablesToTest) {
    try {
      console.log(`\n🔍 Testing table: ${table}`)
      
      // Try to read from the table
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message)
        if (error.code === '42P01') {
          console.log(`   🔧 Table "${table}" does not exist`)
        } else if (error.code === '42501') {
          console.log(`   🔐 Permission denied for table "${table}"`)
        } else {
          console.log(`   ⚠️  Unknown error code: ${error.code}`)
        }
      } else {
        console.log(`✅ Table "${table}" accessible (${count || 0} rows)`)
      }
    } catch (err) {
      console.log(`❌ Exception testing ${table}:`, err.message)
    }
  }
  
  console.log('\n🔍 Testing new columns in existing tables...')
  
  // Test enhanced columns in photo_albums
  try {
    const { data, error } = await supabase
      .from('photo_albums')
      .select('monetization_enabled, premium_content, community_features, ai_enhanced')
      .limit(1)
    
    if (error) {
      console.log('❌ Enhanced photo_albums columns not accessible:', error.message)
    } else {
      console.log('✅ Enhanced photo_albums columns accessible')
    }
  } catch (err) {
    console.log('❌ Exception testing enhanced photo_albums:', err.message)
  }
  
  // Test enhanced columns in album_images
  try {
    const { data, error } = await supabase
      .from('album_images')
      .select('view_count, like_count, share_count, revenue_generated')
      .limit(1)
    
    if (error) {
      console.log('❌ Enhanced album_images columns not accessible:', error.message)
    } else {
      console.log('✅ Enhanced album_images columns accessible')
    }
  } catch (err) {
    console.log('❌ Exception testing enhanced album_images:', err.message)
  }
  
  console.log('\n✨ Database table test complete!')
}

// Run the test
testDatabaseTables().catch(console.error) 