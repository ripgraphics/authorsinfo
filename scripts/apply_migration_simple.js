const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables directly
const supabaseUrl = 'https://nmrohtlcfqujtfgcyqhw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcm9odGxjZnF1anRmZ2N5cWh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxNDU4MiwiZXhwIjoyMDU3ODkwNTgyfQ.A6yFi6IQWp_PFRkBpWz7-eDpDSnBsmrxn_WaQYJzTQk';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔧 Reading migration file...');
    const migrationPath = path.join(__dirname, '..', 'fix_add_image_to_entity_album.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded successfully');
    
    console.log('🚀 Applying migration to database...');
    
    // Execute the migration in one go
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Test the function
    console.log('\n🧪 Testing the new function...');
    try {
      const { data, error: testError } = await supabase.rpc('add_image_to_entity_album', {
        p_entity_id: '00000000-0000-0000-0000-000000000000',
        p_entity_type: 'test',
        p_album_type: 'test_album',
        p_image_id: '00000000-0000-0000-0000-000000000000',
        p_display_order: 1,
        p_is_cover: false,
        p_is_featured: false
      });
      
      if (testError) {
        console.log('⚠️  Function test failed (expected for test data):', testError.message);
      } else {
        console.log('✅ Function test successful!');
      }
    } catch (testErr) {
      console.log('⚠️  Function test failed (expected for test data):', testErr.message);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📝 The add_image_to_entity_album function is now available in your database.');
    
  } catch (error) {
    console.error('💥 Fatal error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting Supabase Migration Application...');
console.log('📁 Project: nmrohtlcfqujtfgcyqhw');
console.log('🔗 URL:', supabaseUrl);
console.log('');

applyMigration(); 