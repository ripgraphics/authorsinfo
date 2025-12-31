import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function runMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('Error: Please provide a migration file path as an argument.');
    console.log('Usage: npx ts-node scripts/run-migration-pg.ts supabase/migrations/your_migration.sql');
    process.exit(1);
  }

  // Use environment variables from .env.local
  let password = process.env.SUPABASE_DB_PASSWORD?.replace(/\\r\\n/g, '').replace(/"/g, '').trim();
  let host = process.env.SUPABASE_DB_HOST?.replace(/\\r\\n/g, '').replace(/"/g, '').trim();
  let user = process.env.SUPABASE_DB_USER?.replace(/\\r\\n/g, '').replace(/"/g, '').trim();
  let database = process.env.SUPABASE_DB_NAME?.replace(/\\r\\n/g, '').replace(/"/g, '').trim();
  let port = parseInt(process.env.SUPABASE_DB_PORT?.replace(/\\r\\n/g, '').replace(/"/g, '').trim() || '5432');

  // Fallback to pooler if direct host fails or if pooler is preferred
  const poolerUrl = process.env.SUPABASE_TRANSACTION_POOLER?.replace(/\\r\\n/g, '').replace(/"/g, '').trim();
  if (poolerUrl) {
    try {
      const url = new URL(poolerUrl);
      host = url.hostname;
      port = parseInt(url.port || '6543');
      user = url.username;
      password = url.password;
      database = url.pathname.substring(1);
      console.log('Using Supabase Transaction Pooler configuration...');
    } catch (e) {
      console.warn('Failed to parse SUPABASE_TRANSACTION_POOLER, falling back to direct connection.');
    }
  }

  if (!password || !host || !user || !database) {
    console.error('Error: Missing database configuration in .env.local');
    console.log('Required: SUPABASE_DB_PASSWORD, SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_NAME');
    process.exit(1);
  }

  console.log(`Connecting to Supabase database ${database} on ${host}...`);

  const client = new Client({
    user,
    host,
    database,
    password,
    port,
    ssl: {
      rejectUnauthorized: false
    },
  });

  try {
    await client.connect();
    console.log('Connected successfully.');

    const migrationPath = path.isAbsolute(migrationFile) 
      ? migrationFile 
      : path.join(process.cwd(), migrationFile);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    console.log(`Reading migration file: ${migrationFile}`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    await client.query(sql);
    
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
