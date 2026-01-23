import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Use the same env loading logic as the migration script
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function getCount() {
  const client = new Client({
    host: process.env.SUPABASE_DB_HOST,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: process.env.SUPABASE_DB_NAME,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false } 
  });

  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM comments');
    console.log(`\n\n[RESULT] Total comments: ${res.rows[0].count}\n\n`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

getCount();
