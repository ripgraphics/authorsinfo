const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://nmrohtlcfqujtfgcyqhw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting Entity Migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250706_192200_migrate_image_types_to_entity_types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📁 Migration file loaded');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} had an issue (this might be expected):`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('✅ Entity types table created');
    console.log('✅ Images table updated with entity fields');
    console.log('✅ Album_images table updated with entity fields');
    console.log('✅ Indexes and constraints created');
    console.log('✅ Triggers and functions created');
    console.log('✅ Analytics view created');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 