const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://nmrohtlcfqujtfgcyqhw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function executeMigration() {
  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  
  console.log('Reading migration file...');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250118000000_create_schema_rpc_functions.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length === 0) continue;
    
    try {
      // Use RPC to execute SQL if available, otherwise use direct query
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        // Try alternative: execute via PostgREST if exec_sql doesn't exist
        console.log(`Statement ${i + 1}: Trying alternative method...`);
        // For now, log that manual execution is needed
        console.log(`\nStatement ${i + 1} needs manual execution:`);
        console.log(statement.substring(0, 100) + '...\n');
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.warn(`⚠ Statement ${i + 1} error: ${err.message}`);
    }
  }
  
  console.log('\n⚠️  Direct SQL execution via Supabase client is limited.');
  console.log('Please run the migration via Supabase Dashboard SQL Editor:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Copy and paste the contents of:');
  console.log(migrationPath);
  console.log('5. Click Run');
}

executeMigration().catch(console.error);

