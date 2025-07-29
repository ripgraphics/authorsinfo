const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Testing Supabase CLI Setup...\n');

// Check if access token is set
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found in .env.local');
  console.log('📝 Please add this line to your .env.local file:');
  console.log('   SUPABASE_ACCESS_TOKEN=sbp_your_access_token_here');
  console.log('\n🔗 Get your access token from: https://app.supabase.com/account/tokens');
  process.exit(1);
}

console.log('✅ Access token found');

// Test CLI authentication
try {
  console.log('\n🔐 Testing CLI authentication...');
  const result = execSync('npx supabase projects list', { 
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });
  console.log('✅ CLI authentication successful');
  console.log('📋 Available projects:');
  console.log(result);
} catch (error) {
  console.error('❌ CLI authentication failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure your access token is correct');
  console.log('2. Make sure you have access to the project');
  console.log('3. Try running: npx supabase login');
  process.exit(1);
}

// Test project linking
try {
  console.log('\n🔗 Testing project linking...');
  const projectRef = 'nmrohtlcfqujtfgcyqhw';
  const linkResult = execSync(`npx supabase link --project-ref ${projectRef}`, { 
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });
  console.log('✅ Project linking successful');
  console.log(linkResult);
} catch (error) {
  console.error('❌ Project linking failed:', error.message);
  console.log('\n🔧 This might be expected if already linked');
}

// Test database connection
try {
  console.log('\n🗄️  Testing database connection...');
  const dbResult = execSync('npx supabase db list', { 
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });
  console.log('✅ Database connection successful');
  console.log('📋 Database schemas:');
  console.log(dbResult);
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
}

console.log('\n🎉 CLI setup test completed!');
console.log('\n📝 Next steps:');
console.log('1. Create migrations: npx supabase migration new migration_name');
console.log('2. Apply migrations: npx supabase db push');
console.log('3. Check status: npx supabase db diff'); 