const fs = require('fs');

console.log('🔧 Applying migration via REST API...\n');

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

async function applyMigration() {
  try {
    console.log('🚀 Executing SQL via REST API...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', response.status, errorText);
      
      // Try alternative approach - check if exec_sql function exists
      console.log('\n🔍 Checking if exec_sql function exists...');
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });
      
      if (checkResponse.status === 404) {
        console.log('❌ exec_sql function does not exist in the database');
        console.log('📝 You need to apply this SQL manually through the Supabase dashboard');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
        console.log('\n📄 SQL to apply:');
        console.log('='.repeat(80));
        console.log(sqlContent);
        console.log('='.repeat(80));
      }
      
      return;
    }

    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n📝 Fallback: Apply manually through Supabase dashboard');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
  }
}

applyMigration(); 