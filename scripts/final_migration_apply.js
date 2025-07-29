const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🔧 Final attempt to apply migration using Supabase CLI...\n');

// Configuration
const accessToken = 'sbp_02f5446adc4b7757e60d0c34ca042edeb7a719c3';
const dbPassword = 'fRK.P_F8.xyftpc';
const projectRef = 'nmrohtlcfqujtfgcyqhw';

async function applyMigration() {
  try {
    console.log('🚀 Attempting to push migration with proper authentication...');
    
    // Set environment variables
    const env = {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: accessToken,
      SUPABASE_DB_PASSWORD: dbPassword
    };
    
    // Try using spawn to handle the password prompt
    console.log('📋 Running supabase db push with automated password...');
    
    const child = spawn('npx', ['supabase', 'db', 'push'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Send the password when prompted
    setTimeout(() => {
      child.stdin.write(dbPassword + '\n');
    }, 2000);
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(text);
    });
    
    return new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Migration applied successfully!');
          console.log('🎉 The add_image_to_entity_album function should now be available!');
          resolve(true);
        } else {
          console.log(`❌ Process exited with code ${code}`);
          
          // If that fails, try alternative approach
          console.log('\n🔄 Trying alternative method...');
          tryAlternativeApproach().then(resolve).catch(reject);
        }
      });
      
      child.on('error', (error) => {
        console.error('❌ Process error:', error.message);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function tryAlternativeApproach() {
  console.log('🔄 Trying to create exec_sql function first...');
  
  // Read the migration content
  const migrationFile = 'supabase/migrations/20250727200709_fix_add_image_to_entity_album_1753646828853.sql';
  const sqlContent = fs.readFileSync(migrationFile, 'utf8');
  
  // Create a simple exec_sql function first
  const createExecSql = `
-- Create exec_sql function to enable programmatic SQL execution
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
  RETURN 'Success: ' || result || ' rows affected';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
  `.trim();
  
  // Write this to a temporary file
  fs.writeFileSync('temp_exec_sql.sql', createExecSql);
  
  console.log('📄 Created temporary exec_sql function file');
  console.log('📝 You need to run this SQL in your Supabase dashboard first:');
  console.log('🔗 https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
  console.log('\n' + '='.repeat(80));
  console.log(createExecSql);
  console.log('='.repeat(80));
  
  console.log('\n📝 Then run this SQL to apply the main migration:');
  console.log('\n' + '='.repeat(80));
  console.log(sqlContent);
  console.log('='.repeat(80));
  
  // Try to open the dashboard
  try {
    execSync('start https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw/sql');
    console.log('\n✅ Opened Supabase dashboard in browser');
  } catch (e) {
    console.log('\n⚠️  Could not open browser automatically');
  }
  
  return false; // Manual intervention needed
}

// Main execution
applyMigration().then((success) => {
  if (!success) {
    console.log('\n📝 Manual intervention required');
    console.log('🔗 Please apply the SQL manually in the Supabase dashboard');
  }
}).catch((error) => {
  console.error('❌ Fatal error:', error.message);
}); 