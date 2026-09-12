import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, '')
}

function resolveCaCertificate() {
  const configuredPath = cleanEnvValue(process.env.SUPABASE_DB_CA_CERT)
  const candidates = [
    configuredPath,
    path.resolve('supabase', 'certs', 'prod-ca-2021.crt'),
    path.resolve('certs', 'prod-ca-2021.crt'),
    path.resolve('prod-ca-2021.crt'),
    path.join(process.env.USERPROFILE || '', 'supabase', 'prod-ca-2021.crt'),
  ].filter((candidate): candidate is string => Boolean(candidate))

  const certificatePath = candidates.find((candidate) => fs.existsSync(candidate))
  if (!certificatePath) return undefined

  console.log(`Using Supabase CA certificate: ${certificatePath}`)
  return fs.readFileSync(certificatePath, 'utf8')
}

async function runMigration() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('Usage: npx ts-node scripts/run-migration-pg.ts <migration-file>')
    console.error(
      'Example: npx ts-node scripts/run-migration-pg.ts supabase/migrations/20260214_example.sql'
    )
    process.exit(1)
  }

  const filePath = path.resolve(migrationFile)
  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(filePath, 'utf-8')
  const caCertificate = resolveCaCertificate()
  const ssl = {
    ca: caCertificate,
    rejectUnauthorized: Boolean(caCertificate),
  }

  if (!caCertificate) {
    console.warn(
      'Supabase CA certificate was not found. Using encrypted TLS without certificate verification. Place prod-ca-2021.crt in supabase/certs/ to enable full verification.'
    )
  }

  // Connection priority: Transaction Pooler > Direct Connection
  const transactionPooler = process.env.SUPABASE_TRANSACTION_POOLER

  let client: Client

  if (transactionPooler) {
    console.log('Using transaction pooler connection...')
    const poolerUrl = new URL(transactionPooler)
    for (const parameter of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
      poolerUrl.searchParams.delete(parameter)
    }
    client = new Client({
      connectionString: poolerUrl.toString(),
      ssl,
    })
  } else {
    const host = process.env.SUPABASE_DB_HOST
    const password = process.env.SUPABASE_DB_PASSWORD
    const user = process.env.SUPABASE_DB_USER
    const database = process.env.SUPABASE_DB_NAME
    const port = parseInt(process.env.SUPABASE_DB_PORT || '5432', 10)

    if (!host || !password || !user || !database) {
      console.error('Missing database configuration in .env.local')
      console.error(
        'Required: SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD, SUPABASE_DB_USER, SUPABASE_DB_NAME'
      )
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
      ssl,
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
