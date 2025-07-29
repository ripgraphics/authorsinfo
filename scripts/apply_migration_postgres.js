const { Client } = require('pg');
const fs = require('fs');

console.log('🔧 Applying migration via direct PostgreSQL connection...\n');

// Read the migration file
const migrationFile = 'supabase/migrations/20250727200709_fix_add_image_to_entity_album_1753646828853.sql';
if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationFile, 'utf8');
console.log('✅ Migration file loaded');

// Database configuration
const connectionConfig = {
  host: 'aws-0-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.nmrohtlcfqujtfgcyqhw',
  // We need to get this password from the user or try common defaults
  password: process.env.SUPABASE_DB_PASSWORD || '',
  ssl: {
    rejectUnauthorized: false
  }
};

async function applyMigration() {
  let client;
  
  try {
    // Check if password is provided
    if (!connectionConfig.password) {
      console.log('❌ Database password not provided');
      console.log('📝 Please set the SUPABASE_DB_PASSWORD environment variable');
      console.log('🔗 You can find the database password in your Supabase dashboard:');
      console.log('   https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/settings/database');
      console.log('\n💡 Run this command with your password:');
      console.log('   $env:SUPABASE_DB_PASSWORD="your_password_here"; node scripts/apply_migration_postgres.js');
      return;
    }
    
    console.log('🔌 Connecting to PostgreSQL database...');
    client = new Client(connectionConfig);
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    console.log('🚀 Executing migration...');
    
    // Execute the entire SQL content
    const result = await client.query(sqlContent);
    
    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', result);
    
    // Verify the function was created
    console.log('\n🔍 Verifying function creation...');
    const verifyResult = await client.query(`
      SELECT routine_name, routine_type, data_type
      FROM information_schema.routines
      WHERE routine_name = 'add_image_to_entity_album'
      AND routine_schema = 'public';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Function verification successful!');
      console.log('📋 Function details:', verifyResult.rows[0]);
      console.log('\n🎉 The "add_image_to_entity_album" function is now available!');
      console.log('📝 You can now test image uploads in your application.');
    } else {
      console.log('⚠️  Function not found in verification query');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔑 Password authentication failed');
      console.log('📝 Please check your database password');
      console.log('🔗 Find it here: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/settings/database');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n🌐 Connection refused - check your network connection');
    } else {
      console.log('\n📝 Full error details:', error);
    }
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Show connection info
console.log('📋 Connection details:');
console.log(`   Host: ${connectionConfig.host}`);
console.log(`   Port: ${connectionConfig.port}`);
console.log(`   Database: ${connectionConfig.database}`);
console.log(`   User: ${connectionConfig.user}`);
console.log(`   Password: ${connectionConfig.password ? '[SET]' : '[NOT SET]'}`);
console.log();

applyMigration(); 