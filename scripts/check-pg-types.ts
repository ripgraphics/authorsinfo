import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function checkPostgresTypes() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length > 0) {
        env[key.trim()] = value.join('=').trim().replace(/^['\"]|['\"]$/g, '');
      }
    });

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc('get_table_columns_info', { p_table_name: 'comments' });
    if (error) {
      // Direct query to information_schema if RPC fails
      const { data: infoData, error: infoError } = await supabase.from('information_schema_columns_view').select('*').eq('table_name', 'comments');
      // If that also fails, let's try a different approach.
      console.log('Error:', error.message);
    } else {
      console.log('--- COMMENTS COLUMNS ---');
      data.forEach((col: any) => {
        console.log(`${col.column_name}: ${col.data_type}`);
      });
    }
  } catch (err: any) {
    console.error('Exception:', err.message);
  }
}

checkPostgresTypes();
