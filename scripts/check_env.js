require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking environment variables...\n');

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
console.log('SUPABASE_ACCESS_TOKEN:', accessToken ? '✅ Found' : '❌ Not found');
if (accessToken) {
  console.log('Token starts with:', accessToken.substring(0, 10) + '...');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Not found');

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Found' : '❌ Not found');

console.log('\n📝 If SUPABASE_ACCESS_TOKEN is not found, please add this line to your .env.local:');
console.log('SUPABASE_ACCESS_TOKEN=sbp_02f5446adc4b7757e60d0c34ca042edeb7a719c3'); 