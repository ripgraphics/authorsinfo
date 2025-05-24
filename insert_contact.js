const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

if (supabaseUrl.includes('your-supabase')) {
  console.log('Please set your Supabase URL and key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertContactInfo() {
  const { data, error } = await supabase
    .from('contact_info')
    .insert({
      entity_type: 'group',
      entity_id: 'ad2f7bca-8977-405c-839c-dad335eadc75',
      email: 'contact@bookloversgroup.com',
      phone: '+1-555-123-4567',
      website: 'https://bookloversgroup.com',
      address_line1: '123 Reading Street',
      address_line2: 'Suite 456',
      city: 'Portland',
      state: 'OR',
      postal_code: '97201',
      country: 'United States'
    })
    .select();

  if (error) {
    console.error('Error inserting contact info:', error);
  } else {
    console.log('Contact info inserted successfully:', data);
  }
}

insertContactInfo(); 