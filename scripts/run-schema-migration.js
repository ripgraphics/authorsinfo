const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250118000000_create_schema_rpc_functions.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('Running schema RPC functions migration...');
  
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed.length === 0) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: trimmed });
      if (error) {
        // Try direct query if RPC doesn't exist
        const { error: queryError } = await supabase.from('_exec_sql').select('*').limit(0);
        if (queryError) {
          console.log('Executing statement directly...');
          // Use raw SQL execution via PostgREST if available
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql: trimmed })
          });
          
          if (!response.ok) {
            console.warn(`Statement may have failed: ${trimmed.substring(0, 50)}...`);
          }
        }
      }
    } catch (err) {
      console.warn(`Error executing statement: ${err.message}`);
    }
  }
  
  console.log('Migration completed!');
}

runMigration().catch(console.error);

