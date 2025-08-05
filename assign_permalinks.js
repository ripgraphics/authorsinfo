const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Generates a permalink from a user's name in the format firstname.lastname
 */
function generatePermalink(name) {
  // Convert name to lowercase and replace spaces/special chars with dots
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '.') // Replace spaces with dots
  
  return cleanName
}

/**
 * Finds an available permalink by checking if the base permalink exists
 * and adding a number suffix if needed
 */
async function findAvailablePermalink(basePermalink) {
  let permalink = basePermalink
  let counter = 0

  while (true) {
    // Check if this permalink already exists
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('permalink', permalink)
      .single()

    if (error && error.code === 'PGRST116') {
      // No user found with this permalink, it's available
      return permalink
    }

    if (error) {
      console.error('Error checking permalink availability:', error)
      // If there's an error, just return the original permalink
      return basePermalink
    }

    // Permalink exists, try with a number suffix
    counter++
    permalink = `${basePermalink}.${counter.toString().padStart(2, '0')}`
  }
}

/**
 * Generates and assigns an available permalink for a user
 */
async function assignPermalink(userId, userName) {
  const basePermalink = generatePermalink(userName)
  const availablePermalink = await findAvailablePermalink(basePermalink)

  // Update the user's permalink
  const { error } = await supabase
    .from('users')
    .update({ 
      permalink: availablePermalink,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user permalink:', error)
    throw error
  }

  return availablePermalink
}

/**
 * Ensures all users have a permalink by generating one if missing
 */
async function ensureAllUsersHavePermalinks() {
  console.log('🔍 Checking for users without permalinks...')
  
  // Get all users without permalinks
  const { data: usersWithoutPermalinks, error } = await supabase
    .from('users')
    .select('id, name, permalink')
    .is('permalink', null)

  if (error) {
    console.error('❌ Error fetching users without permalinks:', error)
    return
  }

  if (!usersWithoutPermalinks || usersWithoutPermalinks.length === 0) {
    console.log('✅ All users already have permalinks')
    return
  }

  console.log(`📝 Found ${usersWithoutPermalinks.length} users without permalinks:`)
  usersWithoutPermalinks.forEach(user => {
    console.log(`   • ${user.name} (ID: ${user.id})`)
  })

  console.log('\n🔄 Assigning permalinks...')
  
  for (const user of usersWithoutPermalinks) {
    try {
      const permalink = await assignPermalink(user.id, user.name)
      console.log(`✅ Assigned permalink "${permalink}" to ${user.name}`)
    } catch (error) {
      console.error(`❌ Failed to assign permalink to ${user.name}:`, error)
    }
  }

  console.log('\n🎉 Permalink assignment complete!')
}

// Run the permalink assignment
ensureAllUsersHavePermalinks() 