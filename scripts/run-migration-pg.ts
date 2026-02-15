// Allow self-signed certificates for Supabase connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function runMigration() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('Usage: npx ts-node scripts/run-migration-pg.ts <migration-file>')
    console.error('Example: npx ts-node scripts/run-migration-pg.ts supabase/migrations/20260214_example.sql')
    process.exit(1)
  }

  const filePath = path.resolve(migrationFile)
  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(filePath, 'utf-8')

  // Connection priority: Transaction Pooler > Direct Connection
  const transactionPooler = process.env.SUPABASE_TRANSACTION_POOLER

  let client: Client

  if (transactionPooler) {
    console.log('Using transaction pooler connection...')
    client = new Client({
      connectionString: transactionPooler,
      ssl: { rejectUnauthorized: false },
    })
  } else {
    const host = process.env.SUPABASE_DB_HOST
    const password = process.env.SUPABASE_DB_PASSWORD
    const user = process.env.SUPABASE_DB_USER
    const database = process.env.SUPABASE_DB_NAME
    const port = parseInt(process.env.SUPABASE_DB_PORT || '5432', 10)

    if (!host || !password || !user || !database) {
      console.error('Missing database configuration in .env.local')
      console.error('Required: SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD, SUPABASE_DB_USER, SUPABASE_DB_NAME')
      console.error('Or set SUPABASE_TRANSACTION_POOLER for pooled connections')
      process.exit(1)
    }

    console.log(`Connecting to Supabase database ${database} on ${host}...`)
    client = new Client({
      host,
      port,
      user,
      password,
      database,
      ssl: { rejectUnauthorized: false },
    })
  }

  try {
    await client.connect()
    console.log('Connected successfully.')

    console.log(`Reading migration file: ${migrationFile}`)
    console.log('Executing migration...')

    await client.query(sql)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
