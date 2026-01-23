import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

function cleanEnv(value?: string) {
  return value?.replace(/\r\n/g, '').replace(/"/g, '').trim()
}

async function run() {
  let password = cleanEnv(process.env.SUPABASE_DB_PASSWORD)
  let host = cleanEnv(process.env.SUPABASE_DB_HOST)
  let user = cleanEnv(process.env.SUPABASE_DB_USER)
  let database = cleanEnv(process.env.SUPABASE_DB_NAME)
  let port = parseInt(cleanEnv(process.env.SUPABASE_DB_PORT) || '5432', 10)

  const poolerUrl = cleanEnv(process.env.SUPABASE_TRANSACTION_POOLER)
  if (poolerUrl) {
    try {
      const url = new URL(poolerUrl)
      host = url.hostname
      port = parseInt(url.port || '6543', 10)
      user = url.username
      password = url.password
      database = url.pathname.substring(1)
      console.log('Using Supabase Transaction Pooler configuration...')
    } catch {
      console.warn('Failed to parse SUPABASE_TRANSACTION_POOLER, falling back to direct connection.')
    }
  }

  if (!password || !host || !user || !database) {
    console.error('Missing database configuration in .env.local')
    process.exit(1)
  }

  const client = new Client({
    user,
    host,
    database,
    password,
    port,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('Connected to live database.')

  const visibilityColumn = await client.query(
    `
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'visibility'
    `
  )
  console.log('posts.visibility column:', visibilityColumn.rows)

  const constraints = await client.query(
    `
    SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'posts'
      AND c.contype = 'c'
    `
  )
  console.log('posts check constraints:', constraints.rows)

  const validateFn = await client.query(
    `
    SELECT pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_activity_data'
    `
  )
  console.log('validate_activity_data definition:', validateFn.rows[0]?.definition || 'not found')

  const policies = await client.query(
    `
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
    `
  )
  console.log('posts RLS policies:', policies.rows)

  await client.end()
}

run().catch((err) => {
  console.error('Live check failed:', err)
  process.exit(1)
})
