import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const permalink = process.argv[2] || 'paul.parker';
let password = process.env.SUPABASE_DB_PASSWORD?.replace(/\r\n/g, '').replace(/"/g, '').trim();
let host = process.env.SUPABASE_DB_HOST?.replace(/\r\n/g, '').replace(/"/g, '').trim();
let dbUser = process.env.SUPABASE_DB_USER?.replace(/\r\n/g, '').replace(/"/g, '').trim();
let database = process.env.SUPABASE_DB_NAME?.replace(/\r\n/g, '').replace(/"/g, '').trim();
let port = parseInt(process.env.SUPABASE_DB_PORT?.replace(/\r\n/g, '').replace(/"/g, '').trim() || '5432', 10);

const poolerUrl = process.env.SUPABASE_TRANSACTION_POOLER?.replace(/\r\n/g, '').replace(/"/g, '').trim();
if (poolerUrl) {
  try {
    const url = new URL(poolerUrl);
    host = url.hostname;
    port = parseInt(url.port || '6543', 10);
    dbUser = url.username;
    password = url.password;
    database = url.pathname.substring(1);
    console.log('Using Supabase Transaction Pooler configuration...');
  } catch {
    console.warn('Failed to parse SUPABASE_TRANSACTION_POOLER, falling back to direct connection.');
  }
}

if (!password || !host || !dbUser || !database) {
  console.error('Missing DB config in .env.local: SUPABASE_DB_PASSWORD, SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_NAME');
  process.exit(1);
}

const { Client } = pg;

async function main() {
  const client = new Client({
    user: dbUser,
    host,
    database,
    password,
    port,
    statement_timeout: 15000,
    query_timeout: 15000,
    connectionTimeoutMillis: 15000,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const psDefault = await client.query(
    "select column_default from information_schema.columns where table_schema='public' and table_name='user_privacy_settings' and column_name='allow_public_reading_profile'",
  );
  const rpDefault = await client.query(
    "select column_default from information_schema.columns where table_schema='public' and table_name='reading_progress' and column_name='privacy_level'",
  );

  console.log('defaults.allow_public_reading_profile =', psDefault.rows[0]?.column_default ?? null);
  console.log('defaults.reading_progress.privacy_level =', rpDefault.rows[0]?.column_default ?? null);

  const userRes = await client.query(
    'select id, permalink from public.users where permalink=$1 limit 1',
    [permalink],
  );

  console.log('user_found =', userRes.rowCount);

  if (userRes.rowCount) {
    const userId = userRes.rows[0].id;

    const privacy = await client.query(
      'select default_privacy_level, allow_public_reading_profile, show_currently_reading_publicly from public.user_privacy_settings where user_id=$1',
      [userId],
    );

    console.log('privacy_settings_rows =', privacy.rowCount);
    console.log('privacy_settings =', privacy.rows[0] ?? null);

    const inProgress = await client.query(
      "select privacy_level, count(*)::int as count from public.reading_progress where user_id=$1 and status='in_progress' group by privacy_level order by privacy_level",
      [userId],
    );

    console.log('in_progress_by_privacy =', inProgress.rows);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
