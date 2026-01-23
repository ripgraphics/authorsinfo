import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function checkTriggers() {
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

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query for triggers on the comments table
    const { data, error } = await supabase.rpc('get_table_triggers', { table_name: 'comments' });
    
    if (error) {
      console.log('Error fetching triggers:', error.message);
      // Fallback: try to find common trigger names
      console.log('Searching for common trigger names...');
    } else {
      console.log('--- COMMENTS TRIGGERS ---');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Exception:', err.message);
  }
}

checkTriggers();
