const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
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
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`\n📋 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      
      // Test the function
      console.log('\n🧪 Testing the new function...');
      try {
        const { data, error } = await supabase.rpc('add_image_to_entity_album', {
          p_entity_id: '00000000-0000-0000-0000-000000000000',
          p_entity_type: 'test',
          p_album_type: 'test_album',
          p_image_id: '00000000-0000-0000-0000-000000000000',
          p_display_order: 1,
          p_is_cover: false,
          p_is_featured: false
        });
        
        if (error) {
          console.log('⚠️  Function test failed (expected for test data):', error.message);
        } else {
          console.log('✅ Function test successful!');
        }
      } catch (testErr) {
        console.log('⚠️  Function test failed (expected for test data):', testErr.message);
      }
      
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fatal error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting Supabase Migration Application...');
console.log('📁 Project:', process.env.SUPABASE_PROJECT_REF || 'Not set');
console.log('🔗 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('');

applyMigration(); 