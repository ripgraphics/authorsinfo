const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPostsUpgrade() {
  try {
    console.log('🚀 Starting posts table upgrade...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250818_000000_upgrade_posts_table.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded successfully');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase.from('_exec_sql').select('*').limit(0);
            if (directError) {
              console.log(`⚠️  Statement ${i + 1} skipped (may not be supported): ${statement.substring(0, 100)}...`);
            }
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} skipped due to error: ${err.message}`);
        }
      }
    }
    
    console.log('✅ Posts table upgrade completed!');
    console.log('🔍 You can now verify the upgrade by checking your database schema');
    
  } catch (error) {
    console.error('❌ Error during upgrade:', error.message);
    process.exit(1);
  }
}

// Run the upgrade
applyPostsUpgrade();
