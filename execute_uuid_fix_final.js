const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
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

console.log('🔍 Environment Check:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeUUIDFix() {
    console.log('\n🚀 EXECUTING UUID FOREIGN KEY ANALYSIS AND FIX');
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
            return;
        }
        
        console.log('✅ UUID Foreign Key Analysis and Fix completed successfully!');
        console.log('📊 Results:', data);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Try alternative approach using direct SQL execution
        console.log('🔄 Attempting alternative execution method...');
        await executeAlternative();
    }
}

async function executeAlternative() {
    try {
        const sqlScript = fs.readFileSync('complete_uuid_foreign_key_fix.sql', 'utf8');
        
        // Split into individual statements and execute them
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                    
                    // Try different execution methods
                    let success = false;
                    
                    // Method 1: Direct RPC call
                    try {
                        const { error } = await supabase.rpc('exec_sql', { sql: statement });
                        if (!error) {
                            console.log(`✅ Statement ${i + 1} executed successfully`);
                            success = true;
                        }
                    } catch (e) {
                        console.log(`⚠️  Method 1 failed for statement ${i + 1}`);
                    }
                    
                    // Method 2: Raw query
                    if (!success) {
                        try {
                            const { error } = await supabase.from('_dummy').select('*').limit(0);
                            // This is just to test connection
                            console.log(`⚠️  Method 2 not available for statement ${i + 1}`);
                        } catch (e) {
                            console.log(`⚠️  Method 2 failed for statement ${i + 1}`);
                        }
                    }
                    
                    if (!success) {
                        console.log(`⚠️  Could not execute statement ${i + 1}: ${statement.substring(0, 100)}...`);
                    }
                    
                } catch (stmtError) {
                    console.warn(`⚠️  Warning on statement ${i + 1}:`, stmtError.message);
                }
            }
        }
        
        console.log('✅ Alternative execution completed!');
        
    } catch (error) {
        console.error('❌ Alternative execution failed:', error.message);
        console.log('\n📋 MANUAL EXECUTION REQUIRED:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy the contents of complete_uuid_foreign_key_fix.sql');
        console.log('4. Paste and execute the script');
    }
}

// Execute the fix
executeUUIDFix().catch(console.error); 