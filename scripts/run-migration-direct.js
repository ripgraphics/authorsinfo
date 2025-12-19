// Direct migration execution using Supabase Admin API
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('Required: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runMigration() {
  console.log('Reading migration file...');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250118000000_create_schema_rpc_functions.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  
  // Execute the entire SQL script
  console.log('Executing migration...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // If exec_sql doesn't exist, we need to use the management API or direct connection
    console.log('Note: Direct RPC execution not available. Please run this migration via:');
    console.log('1. Supabase Dashboard SQL Editor, or');
    console.log('2. Fix the CLI config and run: npx supabase db push --include-all');
    console.log('\nMigration SQL file location:');
    console.log(migrationPath);
    console.log('\nYou can copy the contents and run it in the Supabase Dashboard SQL Editor.');
    return;
  }
  
  console.log('Migration executed successfully!');
  console.log('Result:', data);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  console.log('\nPlease run the migration manually via Supabase Dashboard SQL Editor.');
  console.log('File:', path.join(__dirname, '..', 'supabase', 'migrations', '20250118000000_create_schema_rpc_functions.sql'));
  process.exit(1);
});

