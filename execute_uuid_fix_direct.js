const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
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
        
        // Execute the SQL script
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
        
        if (error) {
            console.error('❌ Error executing SQL script:', error);
            return;
        }
        
        console.log('✅ UUID Foreign Key Analysis and Fix completed successfully!');
        console.log('📊 Results:', data);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Fallback: Execute the script in parts
        console.log('🔄 Attempting fallback execution...');
        await executeFallback();
    }
}

async function executeFallback() {
    try {
        // Read the SQL script
        const sqlScript = fs.readFileSync('complete_uuid_foreign_key_fix.sql', 'utf8');
        
        // Split the script into individual statements
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
                    const { error } = await supabase.rpc('exec_sql', { sql: statement });
                    
                    if (error) {
                        console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (stmtError) {
                    console.warn(`⚠️  Warning on statement ${i + 1}:`, stmtError.message);
                }
            }
        }
        
        console.log('✅ Fallback execution completed!');
        
    } catch (error) {
        console.error('❌ Fallback execution failed:', error.message);
        console.log('\n📋 MANUAL EXECUTION REQUIRED:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy the contents of complete_uuid_foreign_key_fix.sql');
        console.log('4. Paste and execute the script');
    }
}

// Execute the fix
executeUUIDFix().catch(console.error); 