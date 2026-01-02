import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Check total records in user_friends
  const { count, error: countError } = await supabase.from('user_friends').select('*', { count: 'exact', head: true });
  console.log('Total user_friends records:', count);
  if (countError) console.error('Count error:', countError);
  
  // Get some sample records
  const { data, error } = await supabase.from('user_friends').select('*').limit(10);
  console.log('Sample records:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);

  // Check if there's a different friends table
  const { data: tables } = await supabase.rpc('get_tables');
  console.log('Tables with friends:', tables?.filter(t => t.toLowerCase().includes('friend')));
}
check();
