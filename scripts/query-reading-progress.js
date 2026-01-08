// Script to query Supabase directly and show raw reading_progress data
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL. Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function queryReadingProgress() {
  console.log('\n📊 Querying Supabase for raw reading_progress data...\n')
  console.log('=' .repeat(80))
  
  // Query for user: Ivy Ivanov (e8f2a30e-de7f-40a4-9772-06fca7419908)
  const userId = 'e8f2a30e-de7f-40a4-9772-06fca7419908'
  
  console.log(`\n🔍 Fetching reading_progress for user: ${userId}\n`)
  
  const { data: readingProgress, error } = await supabaseAdmin
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error querying reading_progress:', error)
    return
  }

  console.log(`✅ Found ${readingProgress?.length || 0} reading progress entries\n`)
  console.log('=' .repeat(80))
  
  if (!readingProgress || readingProgress.length === 0) {
    console.log('⚠️  No reading progress entries found')
    return
  }

  // Display each entry
  readingProgress.forEach((rp, index) => {
    console.log(`\n📖 Entry ${index + 1}:`)
    console.log('-'.repeat(80))
    console.log(JSON.stringify(rp, null, 2))
    console.log('-'.repeat(80))
  })

  // Now fetch the books data to show pages
  const bookIds = readingProgress.map(rp => rp.book_id).filter(Boolean)
  let booksData = []
  
  if (bookIds.length > 0) {
    console.log(`\n\n📚 Fetching books data for ${bookIds.length} books...\n`)
    
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id, title, pages')
      .in('id', bookIds)

    if (booksError) {
      console.error('❌ Error querying books:', booksError)
    } else {
      booksData = books || []
      console.log(`✅ Found ${booksData.length} books\n`)
      console.log('=' .repeat(80))
      
      if (booksData.length > 0) {
        booksData.forEach((book, index) => {
          console.log(`\n📕 Book ${index + 1}:`)
          console.log('-'.repeat(80))
          console.log(JSON.stringify(book, null, 2))
          console.log('-'.repeat(80))
        })
      }
    }
  }

  // Summary comparison
  console.log('\n\n📊 SUMMARY COMPARISON:\n')
  console.log('=' .repeat(80))
  
  readingProgress.forEach((rp) => {
    const book = booksData.find(b => b.id === rp.book_id)
    const bookTitle = book?.title || 'Unknown'
    const bookPages = book?.pages || null
    
    console.log(`\n📖 Book: ${bookTitle}`)
    console.log(`   Book ID: ${rp.book_id}`)
    console.log(`   progress_percentage: ${rp.progress_percentage} (type: ${typeof rp.progress_percentage})`)
    console.log(`   percentage: ${rp.percentage} (type: ${typeof rp.percentage})`)
    console.log(`   current_page: ${rp.current_page} (type: ${typeof rp.current_page})`)
    console.log(`   total_pages: ${rp.total_pages} (type: ${typeof rp.total_pages})`)
    console.log(`   books.pages: ${bookPages} (type: ${typeof bookPages})`)
    
    // Calculate what percentage should be shown
    let calculatedPercentage = null
    if (rp.current_page !== null && rp.current_page !== undefined && 
        (rp.total_pages !== null && rp.total_pages !== undefined || bookPages !== null)) {
      const totalPages = rp.total_pages || bookPages
      if (totalPages > 0) {
        calculatedPercentage = Math.round((rp.current_page / totalPages) * 100)
        console.log(`   ✅ Calculated from pages: ${calculatedPercentage}% (${rp.current_page}/${totalPages})`)
      }
    } else if (typeof rp.progress_percentage === 'number') {
      console.log(`   ✅ Using progress_percentage: ${rp.progress_percentage}%`)
    } else if (typeof rp.percentage === 'number') {
      console.log(`   ✅ Using percentage: ${rp.percentage}%`)
    } else {
      console.log(`   ⚠️  No progress data available`)
    }
  })
  
  console.log('\n' + '=' .repeat(80))
}

queryReadingProgress()
  .then(() => {
    console.log('\n✅ Query complete!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

