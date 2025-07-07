// Simple debug script for contact_info table
// This will help identify the issue with the upsertContactInfo function

console.log('🔍 Contact Info Debug Script')
console.log('============================')

// Check if we can access environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Environment check:')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('\n❌ Missing environment variables. Please check your .env file.')
  console.log('Required variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Test the exact same operation that's failing
const testContactInfo = {
  entity_type: 'author',
  entity_id: '9953a3e0-4982-4ae5-8093-829c4320ef8d', // Use the actual author ID from the error
  email: 'test@example.com',
  phone: '+1234567890',
  website: 'https://example.com',
  address_line1: '123 Test St',
  city: 'Test City',
  state: 'TS',
  postal_code: '12345',
  country: 'Test Country'
}

console.log('\n📋 Test contact info object:')
console.log(JSON.stringify(testContactInfo, null, 2))

console.log('\n🔧 To test this manually:')
console.log('1. Go to your Supabase dashboard')
console.log('2. Navigate to SQL Editor')
console.log('3. Run this query:')
console.log('')
console.log('SELECT * FROM contact_info WHERE entity_type = \'author\' AND entity_id = \'9953a3e0-4982-4ae5-8093-829c4320ef8d\';')
console.log('')
console.log('4. Then try this upsert:')
console.log('')
console.log('INSERT INTO contact_info (entity_type, entity_id, email, phone, website, address_line1, city, state, postal_code, country, updated_at)')
console.log('VALUES (\'author\', \'9953a3e0-4982-4ae5-8093-829c4320ef8d\', \'test@example.com\', \'+1234567890\', \'https://example.com\', \'123 Test St\', \'Test City\', \'TS\', \'12345\', \'Test Country\', NOW())')
console.log('ON CONFLICT (entity_type, entity_id) DO UPDATE SET')
console.log('  email = EXCLUDED.email,')
console.log('  phone = EXCLUDED.phone,')
console.log('  website = EXCLUDED.website,')
console.log('  address_line1 = EXCLUDED.address_line1,')
console.log('  city = EXCLUDED.city,')
console.log('  state = EXCLUDED.state,')
console.log('  postal_code = EXCLUDED.postal_code,')
console.log('  country = EXCLUDED.country,')
console.log('  updated_at = NOW();')
console.log('')

console.log('🎯 Possible issues:')
console.log('1. Missing unique constraint on (entity_type, entity_id)')
console.log('2. RLS (Row Level Security) policies blocking the operation')
console.log('3. Missing permissions for the current user')
console.log('4. Database connection issues')
console.log('5. Table structure mismatch')

console.log('\n📝 Next steps:')
console.log('1. Check if the contact_info table exists')
console.log('2. Verify the table structure matches the expected schema')
console.log('3. Check RLS policies')
console.log('4. Test with a different user or admin role') 