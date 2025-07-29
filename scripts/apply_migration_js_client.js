const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🔧 Applying migration via JavaScript client...\n');

// Read the SQL file
const sqlFile = 'fix_add_image_to_entity_album.sql';
if (!fs.existsSync(sqlFile)) {
  console.error(`❌ SQL file not found: ${sqlFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFile, 'utf8');
console.log('✅ SQL file loaded');

// Supabase configuration
const supabaseUrl = 'https://nmrohtlcfqujtfgcyqhw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcm9odGxjZnF1anRmZ2N5cWh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxNDU4MiwiZXhwIjoyMDU3ODkwNTgyfQ.A6yFi6IQWp_PFRkBpWz7-eDpDSnBsmrxn_WaQYJzTQk';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  try {
    console.log('🚀 Executing SQL via JavaScript client...');
    
    // Split SQL into individual statements
    const statements = sqlContent
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
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
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
      console.log('📝 The add_image_to_entity_album function is now available in your database.');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the logs above.');
      
      // If exec_sql function doesn't exist, provide manual instructions
      if (errorCount === statements.length) {
        console.log('\n📝 The exec_sql function does not exist. Please apply manually:');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
        console.log('\n📄 Copy and paste this SQL:');
        console.log('='.repeat(80));
        console.log(sqlContent);
        console.log('='.repeat(80));
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n📝 Fallback: Apply manually through Supabase dashboard');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
    console.log('\n📄 SQL to apply:');
    console.log('='.repeat(80));
    console.log(sqlContent);
    console.log('='.repeat(80));
  }
}

applyMigration(); 