const { Client } = require('pg');

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL?.replace(/\\r\\n|\\n|\\r/g, '').trim();
  
  if (!connectionString) {
    console.error('Missing SUPABASE_DB_URL');
    process.exit(1);
  }
  
  console.log('Connecting to Supabase PostgreSQL...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected!\n');
    
    // Get all table counts in one query using pg_stat_user_tables
    const { rows } = await client.query(`
      SELECT 
        tablename,
        n_live_tup as estimated_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC;
    `);
    
    console.log(`Found ${rows.length} tables\n`);
    
    // Filter out system tables
    const tables = rows.filter(r => 
      !r.tablename.startsWith('pg_') && 
      !r.tablename.startsWith('supabase_') && 
      !r.tablename.startsWith('_') &&
      r.tablename !== 'schema_migrations' &&
      r.tablename !== 'migrations'
    );
    
    console.log(`Tables with data: ${tables.filter(t => t.estimated_rows > 0).length}`);
    console.log(`Total estimated rows: ${tables.reduce((sum, t) => sum + (t.estimated_rows || 0), 0)}\n`);
    
    console.log('--- All Tables by Row Count ---');
    for (const t of tables.slice(0, 80)) {
      const rowCount = t.estimated_rows || 0;
      console.log(`${t.tablename.padEnd(45)} | ${(rowCount || 0).toString().padStart(8)} rows`);
    }
    
    // Save report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'artifacts', 'supabase-pg-counts.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(tables, null, 2));
    console.log(`\nSaved to: ${reportPath}`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
