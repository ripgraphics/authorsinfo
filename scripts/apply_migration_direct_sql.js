const fs = require('fs');

console.log('🔧 Applying migration via direct SQL execution...\n');

// Read the migration file
const migrationFile = 'supabase/migrations/20250727200709_fix_add_image_to_entity_album_1753646828853.sql';
if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationFile, 'utf8');
console.log('✅ Migration file loaded');

// Configuration
const supabaseUrl = 'https://nmrohtlcfqujtfgcyqhw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcm9odGxjZnF1anRmZ2N5cWh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxNDU4MiwiZXhwIjoyMDU3ODkwNTgyfQ.A6yFi6IQWp_PFRkBpWz7-eDpDSnBsmrxn_WaQYJzTQk';

async function executeSQL() {
  try {
    console.log('🚀 Creating exec_sql function...');
    
    // First, create the exec_sql function
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  EXECUTE sql;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN 'Executed successfully. Rows affected: ' || result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
    `.trim();
    
    const createFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        sql: createFunctionSQL
      })
    });
    
    if (createFunctionResponse.ok) {
      console.log('✅ exec_sql function created successfully');
    } else {
      // Try alternative approach - split the SQL and execute parts individually
      console.log('⚠️  Creating exec_sql function failed, trying direct execution...');
      
      // Split SQL into executable statements
      const statements = sqlContent
        .split(/;\s*$/m)
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Found ${statements.length} statements to execute`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim().length === 0) continue;
        
        try {
          console.log(`\n📋 Executing statement ${i + 1}/${statements.length}...`);
          
          // Use different endpoints based on the statement type
          let endpoint;
          let method = 'POST';
          let body;
          
          if (statement.toLowerCase().includes('create function') || 
              statement.toLowerCase().includes('create or replace function')) {
            // For function creation, try using the SQL endpoint
            endpoint = `${supabaseUrl}/rest/v1/rpc/query`;
            body = JSON.stringify({ query: statement });
          } else if (statement.toLowerCase().includes('grant')) {
            // For grants, try using the SQL endpoint
            endpoint = `${supabaseUrl}/rest/v1/rpc/query`;
            body = JSON.stringify({ query: statement });
          } else {
            // For other statements, try direct execution
            endpoint = `${supabaseUrl}/rest/v1/rpc/query`;
            body = JSON.stringify({ query: statement });
          }
          
          const response = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Prefer': 'return=minimal'
            },
            body
          });
          
          if (response.ok) {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          } else {
            const errorText = await response.text();
            console.log(`❌ Statement ${i + 1} failed: ${errorText}`);
            errorCount++;
          }
          
        } catch (err) {
          console.log(`❌ Exception in statement ${i + 1}: ${err.message}`);
          errorCount++;
        }
      }
      
      console.log(`\n📊 Migration Summary:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      
      if (successCount > 0) {
        console.log('\n🎉 Some statements executed successfully!');
        console.log('📝 Check your Supabase dashboard to verify the function was created.');
      }
      
      return;
    }
    
    // Now execute the migration using the exec_sql function
    console.log('\n🚀 Executing migration...');
    const migrationResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });
    
    if (migrationResponse.ok) {
      const result = await migrationResponse.json();
      console.log('✅ Migration executed successfully!');
      console.log('Result:', result);
    } else {
      const errorText = await migrationResponse.text();
      console.log('❌ Migration failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 The migration needs to be applied manually through the Supabase dashboard.');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
  }
}

executeSQL(); 