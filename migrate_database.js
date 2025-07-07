const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeMigration() {
  try {
    console.log('🚀 Starting migration to add created_by fields...')
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('execute_migration.sql', 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        })
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error)
          console.error('Statement:', statement)
          process.exit(1)
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('🎉 Migration completed successfully!')
    console.log('✅ Added created_by fields to books and authors tables')
    console.log('✅ Set all existing records to user ID: e06cdf85-b449-4dcb-b943-068aaad8cfa3')
    console.log('✅ Created foreign key constraints')
    console.log('✅ Created performance indexes')
    
  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

executeMigration() 