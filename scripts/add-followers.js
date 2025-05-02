require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Get publisher target type ID
async function getPublisherTargetTypeId() {
  const { data, error } = await supabase
    .from('follow_target_types')
    .select('id')
    .eq('name', 'publisher')
    .single()

  if (error) {
    console.error('Error fetching publisher target type:', error)
    throw error
  }

  return data.id
}

// Add followers to a publisher
async function addFollowersToPublisher(publisherId, userIds) {
  try {
    const targetTypeId = await getPublisherTargetTypeId()
    
    const followData = userIds.map(userId => ({
      follower_id: userId,
      following_id: publisherId,
      target_type_id: targetTypeId,
    }))

    const { data, error } = await supabase
      .from('follows')
      .insert(followData)
      .select()

    if (error) {
      console.error('Error adding followers to publisher:', error)
      throw error
    }

    console.log(`Successfully added ${data.length} followers to publisher ID ${publisherId}`)
    return data
  } catch (error) {
    console.error('Error adding followers to publisher:', error)
    throw error
  }
}

// User IDs from your database
const userIds = [
  '14b745e4-bf9c-4f3e-bd7d-1eb005cfbd8c', // James Rodriguez
  '17a41d5b-81ba-4206-b717-499566ae080a', // Jennifer Garcia
  '1ecbee4d-1edf-4c47-8763-3470a61ce1c8', // Robert Jones
  '29f24065-9899-4a80-83f4-82acb45d1c7c', // James Wilson
  '33303e51-3a14-4766-a68d-57986263cb92', // Michael Miller
  '36ee0e21-6c56-46e2-b296-ae69b8fc8626', // James Moore
  '3c2c53c5-ea85-44a8-88fa-71bb04780e72', // James Smith
  '3c97695e-bad9-457f-bdbd-88d433f8186d', // Test User
  '4211673d-f5d6-43a1-87cd-6caffc01b866', // James Anderson
  '538b2444-15b8-41a7-bea6-7509e3180f3b', // James Lee
  '5ba5a105-c82e-4f73-b038-c088ffbde767', // Mary Johnson
  '6c59d79d-a9fd-4eff-b38c-1f40bc5342e9', // James Johnson
  '6d3d40f2-eb7b-4b36-bd68-38061ef336ee', // James Davis
  '751dbc76-b23d-4d4d-961e-fcf198a2cd08', // James Williams
  '8748d399-822b-4b68-b010-d420da5d6b14', // James Martinez
]

// Publisher ID to add followers to
const PUBLISHER_ID = 291

// Execute the script
addFollowersToPublisher(PUBLISHER_ID, userIds)
  .then(() => {
    console.log('All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  }) 