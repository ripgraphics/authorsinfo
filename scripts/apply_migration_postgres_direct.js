const { Client } = require('pg');
const fs = require('fs');

console.log('🔧 Applying migration via direct PostgreSQL connection (bypassing pooler)...\n');

// Read the migration file
const migrationFile = 'supabase/migrations/20250727200709_fix_add_image_to_entity_album_1753646828853.sql';
if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationFile, 'utf8');
console.log('✅ Migration file loaded');

// Database configuration - try direct connection
const connectionConfigs = [
  {
    name: 'Direct Database Connection',
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.nmrohtlcfqujtfgcyqhw',
    password: 'fRK.P_F8.xyftpc',
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'IPv6 Connection',
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.nmrohtlcfqujtfgcyqhw',
    password: 'fRK.P_F8.xyftpc',
    ssl: { rejectUnauthorized: false },
    family: 6
  },
  {
    name: 'Alternative Port',
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.nmrohtlcfqujtfgcyqhw',
    password: 'fRK.P_F8.xyftpc',
    ssl: false
  }
];

async function tryConnection(config) {
  let client;
  
  try {
    console.log(`🔌 Trying ${config.name}...`);
    console.log(`   Host: ${config.host}:${config.port}`);
    
    client = new Client(config);
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('🚀 Executing migration...');
    
    // Split SQL into statements and execute one by one
    const statements = sqlContent
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`📋 Executing statement ${i + 1}/${statements.length}...`);
        await client.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
      } catch (error) {
        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
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
        return true;
      } else {
        console.log('⚠️  Function not found in verification query');
      }
    }
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  return false;
}

async function applyMigration() {
  console.log('🔧 Trying multiple connection methods...\n');
  
  for (const config of connectionConfigs) {
    const success = await tryConnection(config);
    if (success) {
      console.log('\n🎉 Migration applied successfully!');
      return;
    }
    console.log(''); // Add spacing between attempts
  }
  
  console.log('❌ All connection methods failed');
  console.log('\n📝 The migration needs to be applied manually through the Supabase dashboard.');
  console.log('🔗 Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
}

applyMigration(); 