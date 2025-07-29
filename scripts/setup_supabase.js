const { execSync } = require('child_process');

console.log('🔧 Setting up Supabase CLI...\n');

// Set the access token
const accessToken = 'sbp_02f5446adc4b7757e60d0c34ca042edeb7a719c3';
const projectRef = 'nmrohtlcfqujtfgcyqhw';

// Test projects list
try {
  console.log('📋 Testing projects list...');
  const projectsResult = execSync('npx supabase projects list', {
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });
  console.log('✅ Projects list successful');
  console.log(projectsResult);
} catch (error) {
  console.error('❌ Projects list failed:', error.message);
  process.exit(1);
}

// Link to project
try {
  console.log('\n🔗 Linking to project...');
  const linkResult = execSync(`npx supabase link --project-ref ${projectRef}`, {
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });
  console.log('✅ Project linking successful');
  console.log(linkResult);
} catch (error) {
  console.error('❌ Project linking failed:', error.message);
  console.log('This might be expected if already linked');
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

console.log('\n🎉 Supabase CLI setup completed!');
console.log('\n📝 Next steps:');
console.log('1. Create migrations: npx supabase migration new migration_name');
console.log('2. Apply migrations: npx supabase db push');
console.log('3. Check status: npx supabase db diff'); 