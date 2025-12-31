import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function checkTables() {
  const password = process.env.SUPABASE_DB_PASSWORD?.replace(/\\r\\n/g, '').replace(/"/g, '').trim();
  const host = 'aws-0-us-east-2.pooler.supabase.com'; // Use pooler as it worked before
  const user = 'postgres.nmrohtlcfqujtfgcyqhw';
  const database = 'postgres';
  const port = 6543;

  const client = new Client({
    user,
    host,
    database,
    password,
    port,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND (table_name ILIKE '%profile%' OR table_name ILIKE '%user%')
    `);
    console.log('Matching tables:', res.rows.map(r => r.table_name).sort());
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await client.end();
  }
}

checkTables();
