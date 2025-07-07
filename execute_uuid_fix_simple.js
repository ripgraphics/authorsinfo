const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env file manually
function loadEnv() {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        const env = {};
        
        envFile.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        });
        
        return env;
    } catch (error) {
        console.error('❌ Error reading .env.local file:', error.message);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    console.log('\n📋 MANUAL EXECUTION REQUIRED:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of complete_uuid_foreign_key_fix.sql');
    console.log('4. Paste and execute the script');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeUUIDFix() {
    console.log('🚀 EXECUTING UUID FOREIGN KEY ANALYSIS AND FIX');
    console.log('================================================');
    
    try {
        // Read the SQL script
        const sqlScript = fs.readFileSync('complete_uuid_foreign_key_fix.sql', 'utf8');
        
        console.log('📋 Executing comprehensive UUID foreign key analysis and fix...');
        console.log('⏳ This may take a few moments...');
        
        // Execute the SQL script using raw query
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
        
        if (error) {
            console.error('❌ Error executing SQL script:', error);
            console.log('\n📋 MANUAL EXECUTION REQUIRED:');
            console.log('1. Go to your Supabase dashboard');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Copy the contents of complete_uuid_foreign_key_fix.sql');
            console.log('4. Paste and execute the script');
            return;
        }
        
        console.log('✅ UUID Foreign Key Analysis and Fix completed successfully!');
        console.log('📊 Results:', data);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📋 MANUAL EXECUTION REQUIRED:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy the contents of complete_uuid_foreign_key_fix.sql');
        console.log('4. Paste and execute the script');
    }
}

// Execute the fix
executeUUIDFix().catch(console.error); 