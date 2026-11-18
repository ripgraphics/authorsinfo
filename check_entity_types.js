const { fetchQuery } = require('convex/nextjs')
const { api } = require('./convex/_generated/api')

async function main() {
  const images = await fetchQuery(api.queries.photos.listPhotos, { limit: 20 })
  images.forEach(img => {
    console.log(`entity_type_id=${img.entity_type_id}, entity_id=${img.entity_id}, image_type=${img.image_type}`)
  })
}

main().catch(console.error)