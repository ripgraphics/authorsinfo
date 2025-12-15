/**
 * Quick script to check image metadata
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkImage() {
  const imageId = '2224383f-d90c-4216-b203-377b86895a0c'

  const { data: image, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Image:', JSON.stringify(image, null, 2))
  }
}

checkImage().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })

