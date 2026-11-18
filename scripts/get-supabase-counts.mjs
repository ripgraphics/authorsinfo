import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load from correct env file
const envPath = '.env old.local';
dotenv.config({ path: envPath });

console.log(`Loaded env from ${envPath}`);

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\r\n|\n|\r/g, '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\r\n|\n|\r/g, '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl.split('.')[0]}.supabase.co`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Get all public tables
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');
  
  if (error) {
    console.error('Error getting tables:', error.message);
    return;
  }
  
  console.log(`Found ${tables.length} tables\n`);
  
  // Count rows in each table
  const results = [];
  for (let i = 0; i < tables.length; i++) {
    const tableName = tables[i].table_name;
    
    // Skip system tables
    if (tableName.startsWith('pg_') || tableName.startsWith('supabase_') || tableName.startsWith('_')) continue;
    
    try {
      const { count, error: e } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      results.push({
        table: tableName,
        rows: count || 0,
        error: e?.message || null
      });
      
      if ((i + 1) % 20 === 0) {
        console.log(`  Progress: ${i + 1}/${tables.length}`);
      }
    } catch (e) {
      results.push({
        table: tableName,
        rows: 0,
        error: e.message
      });
    }
  }
  
  // Sort by row count descending
  results.sort((a, b) => b.rows - a.rows);
  
  // Save report
  const reportPath = path.join(process.cwd(), 'artifacts', 'supabase-all-tables.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log(`\n=== RESULTS SAVED TO ${reportPath} ===\n`);
  
  // Print summary
  const withData = results.filter(r => r.rows > 0);
  const withoutData = results.filter(r => r.rows === 0);
  const errors = results.filter(r => r.error);
  
  console.log(`Tables with data: ${withData.length}`);
  console.log(`Tables without data: ${withoutData.length}`);
  console.log(`Errors: ${errors.length}`);
  
  console.log('\n--- Top Tables by Row Count ---');
  for (const r of withData.slice(0, 50)) {
    console.log(`${r.table.padEnd(45)} | ${String(r.rows).padStart(8)} rows`);
  }
  
  const totalRows = withData.reduce((sum, r) => sum + r.rows, 0);
  console.log(`\nTotal rows across all tables: ${totalRows}`);
}

main().catch(console.error);