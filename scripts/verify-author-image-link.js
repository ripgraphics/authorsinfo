/* eslint-disable no-console */

const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const { Client } = require('pg')

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

function cleanEnv(value) {
  return (value || '').toString().replace(/\r\n/g, '').replace(/"/g, '').trim()
}

function getConnectionConfig() {
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
      // ignore
    }
  }

  if (!password || !host || !user || !database) {
    throw new Error(
      'Missing DB env in .env.local (need SUPABASE_DB_PASSWORD, SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_NAME)'
    )
  }

  return {
    user,
    host,
    database,
    password,
    port,
    ssl: { rejectUnauthorized: false },
  }
}

async function main() {
  const nameLike = process.argv[2] || 'Envy Red'

  const client = new Client(getConnectionConfig())
  await client.connect()

  const res = await client.query(
    `
      select
        a.id,
        a.name,
        a.author_image_id,
        i.url as image_url
      from authors a
      left join images i on i.id = a.author_image_id
      where a.name ilike $1
      order by a.name asc
      limit 20
    `,
    [`%${nameLike}%`]
  )

  console.log(JSON.stringify(res.rows, null, 2))

  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
