import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('URL:', url);
  console.log('Key present:', !!key);
  
  if (!url || !key) {
    console.error('Missing URL or Key');
    return;
  }
  
  const supabase = createClient(url, key);
  
  try {
    const { data, error } = await supabase.from('books').select('count');
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Supabase success, data:', data);
    }
  } catch (error: any) {
    console.error('Fetch failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testSupabase();
