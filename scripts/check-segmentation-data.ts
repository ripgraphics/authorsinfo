import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function checkSegmentationData() {
  const password = process.env.SUPABASE_DB_PASSWORD?.replace(/\\r\\n/g, '').replace(/"/g, '').trim();
  const host = 'aws-0-us-east-2.pooler.supabase.com';
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

    // Check segment_distributions table
    console.log('\n=== segment_distributions table structure ===');
    try {
      const distCols = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'segment_distributions'
        ORDER BY ordinal_position
      `);
      console.log(distCols.rows);
      
      const distData = await client.query('SELECT * FROM segment_distributions LIMIT 3');
      console.log('\nData:', distData.rows);
    } catch (e) {
      console.log('Error:', (e as any).message);
    }

    // Check segment_events table
    console.log('\n=== segment_events table structure ===');
    try {
      const eventsCols = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'segment_events'
        ORDER BY ordinal_position
      `);
      console.log(eventsCols.rows);
    } catch (e) {
      console.log('Error:', (e as any).message);
    }

  } catch (err) {
    console.error('Data check failed:', err);
  } finally {
    await client.end();
  }
}

checkSegmentationData();
