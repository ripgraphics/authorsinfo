import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Get ALL table counts in ONE query using information_schema
  const { data, error } = await supabase.rpc('get_all_table_counts');
  
  if (error) {
    console.error('Error:', error.message);
    
    // Fallback: direct SQL via PostgREST-style or try count endpoint
    console.log('\nTrying fallback...');
    
    // Use postgres protocol directly if possible
    const { data: pgData } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    console.log('Tables found:', pgData?.length);
    
    // Now count each - but batch this
    const results = [];
    for (const t of pgData.slice(0, 50)) {
      try {
        const { count, error: e } = await supabase
          .from(t.table_name)
          .select('*', { count: 'exact', head: true });
        results.push({ table: t.table_name, supabase_rows: count || 0 });
      } catch (e2) {
        results.push({ table: t.table_name, supabase_rows: 0, error: e2.message });
      }
    }
    
    console.log(`Sampled ${results.length} tables`);
    console.log(JSON.stringify(results.slice(0, 20), null, 2));
    return;
  }
  
  console.log('All table counts retrieved!');
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
