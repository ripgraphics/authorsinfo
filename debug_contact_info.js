const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugContactInfo() {
  try {
    console.log('🔍 Testing contact_info table...')
    
    // 1. Test basic connection
    console.log('1. Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('contact_info')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Connection error:', testError)
      return
    }
    
    console.log('✅ Connection successful')
    console.log('📊 Sample data:', testData)
    
    // 2. Test table structure
    console.log('\n2. Testing table structure...')
    const { data: structure, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'contact_info' })
    
    if (structureError) {
      console.log('⚠️ Could not get table structure via RPC, trying direct query...')
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'contact_info')
        .eq('table_schema', 'public')
      
      if (columnsError) {
        console.error('❌ Error getting columns:', columnsError)
      } else {
        console.log('📋 Table columns:', columns)
      }
    } else {
      console.log('📋 Table structure:', structure)
    }
    
    // 3. Test upsert operation
    console.log('\n3. Testing upsert operation...')
    const testContactInfo = {
      entity_type: 'author',
      entity_id: 'test-author-id',
      email: 'test@example.com',
      phone: '+1234567890',
      website: 'https://example.com',
      address_line1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'Test Country'
    }
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('contact_info')
      .upsert(testContactInfo)
      .select()
      .single()
    
    if (upsertError) {
      console.error('❌ Upsert error:', upsertError)
      console.error('Error details:', {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code
      })
    } else {
      console.log('✅ Upsert successful:', upsertData)
    }
    
    // 4. Clean up test data
    console.log('\n4. Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('contact_info')
      .delete()
      .eq('entity_id', 'test-author-id')
    
    if (deleteError) {
      console.error('❌ Cleanup error:', deleteError)
    } else {
      console.log('✅ Test data cleaned up')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

debugContactInfo() 