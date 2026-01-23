import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function checkEngagementTables() {
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

    const tables = ['engagement_likes', 'engagement_comments', 'likes', 'comments'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        console.log(`Table ${table} does NOT exist or error: ${error.message}`);
      } else {
        console.log(`Table ${table} EXISTS.`);
      }
    }
  } catch (err: any) {
    console.error('Exception:', err.message);
  }
}

checkEngagementTables();
