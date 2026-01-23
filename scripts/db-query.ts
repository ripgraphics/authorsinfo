import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function queryDB() {
  // Parse the transaction pooler URL (recommended connection method)
  const poolerUrl = process.env.SUPABASE_TRANSACTION_POOLER;
  
  if (!poolerUrl) {
    console.error('ERROR: SUPABASE_TRANSACTION_POOLER not set in .env.local');
    process.exit(1);
  }

  // Clean up the URL value
  const cleanUrl = poolerUrl.replace(/"/g, '').trim();
  
  console.log('Connecting to Supabase via transaction pooler...');
  
  // Disable SSL verification for Node.js process
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const client = new Client({
    connectionString: cleanUrl,
    ssl: true
  });

  try {
    await client.connect();
    console.log('Connected successfully!');
    
    // Get the SQL query from command line args
    const query = process.argv[2] || 'SELECT count(*) FROM comments;';
    console.log(`Executing: ${query}`);
    
    const result = await client.query(query);
    
    console.log('\n========== RESULT ==========');
    console.log(JSON.stringify(result.rows, null, 2));
    console.log('============================\n');
    
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await client.end();
  }
}

queryDB();
