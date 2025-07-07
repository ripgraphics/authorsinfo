const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Starting migration to add created_by fields to books and authors tables...')
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('add_created_by_to_books_authors.sql', 'utf8')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }
    
    console.log('Migration completed successfully!')
    console.log('✅ Added created_by fields to books and authors tables')
    console.log('✅ Set all existing records to user ID: e06cdf85-b449-4dcb-b943-068aaad8cfa3')
    console.log('✅ Created foreign key constraints')
    console.log('✅ Created performance indexes')
    
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

runMigration() 