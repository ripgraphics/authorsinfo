/**
 * Repair Script: Backfill missing book back covers into Book Images album
 *
 * Goal:
 * - Ensure books with an existing back cover image in `images` have a corresponding
 *   `album_images` record in the dedicated "Book Images - %" album with:
 *   - image_type = 'book_cover_back'
 *
 * This script is:
 * - Idempotent (skips books that already have a back cover in `get_book_images`)
 * - Safe (does not delete anything; does not modify schema; does not touch books.cover_image_id)
 *
 * Usage:
 *   npx tsx scripts/repair-missing-book-back-covers.ts
 *   npx tsx scripts/repair-missing-book-back-covers.ts --book-id <uuid>
 *   npx tsx scripts/repair-missing-book-back-covers.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

type BookRow = { id: string; title: string | null }
type BookImageType = 'book_cover_front' | 'book_cover_back' | 'book_gallery'

// Load local env files for script execution (Next.js loads these automatically; Node scripts do not).
dotenv.config({ path: '.env.local' })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function getArgValue(flag: string): string | null {
  const idx = process.argv.findIndex((a) => a === flag)
  if (idx < 0) return null
  return process.argv[idx + 1] || null
}

const targetBookId = getArgValue('--book-id')
const dryRun = process.argv.includes('--dry-run')

async function getAdminUserId(): Promise<string> {
  // Prefer an admin/super_admin from profiles (matches app auth model)
  try {
    const { data: profile, error } = await (supabase.from('profiles') as any)
      .select('user_id, role')
      .in('role', ['admin', 'super_admin'])
      .limit(1)
      .maybeSingle()

    if (!error && profile?.user_id) return String(profile.user_id)
  } catch {
    // ignore
  }

  // Fallback: first user row if present
  const { data: user } = await (supabase.from('users') as any).select('id').limit(1).maybeSingle()
  if (user?.id) return String(user.id)

  throw new Error('Unable to determine an admin/system user id for p_user_id')
}

async function getExistingBookImages(
  bookId: string,
  imageType: BookImageType | null
): Promise<any[]> {
  const { data, error } = await (supabase.rpc as any)('get_book_images', {
    p_book_id: bookId,
    p_image_type: imageType ?? undefined,
  })

  if (error) throw error
  return Array.isArray(data) ? data : []
}

async function getImagesSelectColumns(): Promise<string> {
  // Mirror the “check actual schema” approach: fetch a sample row and build a safe select list.
  const { data: sample } = await (supabase.from('images') as any).select('*').limit(1).maybeSingle()
  const cols = new Set(sample ? Object.keys(sample) : [])

  // Always require id + url
  const selectCols: string[] = ['id', 'url']
  if (cols.has('alt_text')) selectCols.push('alt_text')
  if (cols.has('metadata')) selectCols.push('metadata')
  if (cols.has('created_at')) selectCols.push('created_at')
  if (cols.has('updated_at')) selectCols.push('updated_at')

  return selectCols.join(', ')
}

function pickBestCandidate(candidates: any[]): any | null {
  if (!candidates || candidates.length === 0) return null

  // Prefer newest by created_at when available
  const withCreatedAt = candidates.filter((c) => c?.created_at)
  if (withCreatedAt.length > 0) {
    return withCreatedAt.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
  }

  return candidates[0]
}

async function findBackCoverCandidateImage(bookId: string, selectCols: string): Promise<any | null> {
  // Candidate selection is conservative:
  // - must be tagged in metadata for the book
  // - and should be clearly a back cover via alt_text when available
  let query = (supabase.from('images') as any)
    .select(selectCols)
    .contains('metadata', { entity_type: 'book', entity_id: bookId })

  // Try to narrow to back covers based on alt_text if the column exists
  const sampleHasAltText = selectCols.split(',').map((s) => s.trim()).includes('alt_text')
  if (sampleHasAltText) {
    // Most back cover uploads via /api/upload/entity-image use alt_text like:
    // "bookCoverBack for book <bookId>"
    query = query.or('alt_text.ilike.%bookcoverback%,alt_text.ilike.%book back cover%')
  }

  const { data, error } = await query.limit(10)
  if (error) throw error

  const candidates = Array.isArray(data) ? data : []
  return pickBestCandidate(candidates)
}

async function listBooksBatch(offset: number, limit: number): Promise<BookRow[]> {
  const q = (supabase.from('books') as any)
    .select('id, title')
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error } = await q
  if (error) throw error
  return (data || []) as BookRow[]
}

async function repairBookBackCover(book: BookRow, adminUserId: string, selectCols: string) {
  const bookId = book.id

  const existingBack = await getExistingBookImages(bookId, 'book_cover_back')
  if (existingBack.length > 0) {
    return { status: 'skipped_exists' as const }
  }

  const candidate = await findBackCoverCandidateImage(bookId, selectCols)
  if (!candidate?.id || !candidate?.url) {
    return { status: 'not_found' as const }
  }

  if (dryRun) {
    return { status: 'dry_run' as const, imageId: candidate.id, url: candidate.url }
  }

  // Link via the canonical DB function so it lands in the correct Book Images album.
  const { data: recordId, error } = await (supabase.rpc as any)('set_book_cover_image', {
    p_book_id: bookId,
    p_image_id: candidate.id,
    p_cover_type: 'book_cover_back',
    p_user_id: adminUserId,
  })
  if (error) throw error

  // Verify
  const verify = await getExistingBookImages(bookId, 'book_cover_back')
  if (verify.length === 0) {
    return { status: 'failed_verify' as const, imageId: candidate.id, recordId }
  }

  return { status: 'repaired' as const, imageId: candidate.id, recordId, url: candidate.url }
}

async function main() {
  const adminUserId = await getAdminUserId()
  const selectCols = await getImagesSelectColumns()

  console.log('🚀 Repair missing book back covers')
  console.log('   dryRun:', dryRun)
  console.log('   targetBookId:', targetBookId || '(all)')
  console.log('   adminUserId:', adminUserId)
  console.log('   imagesSelect:', selectCols)

  let scanned = 0
  let repaired = 0
  let skipped = 0
  let notFound = 0
  let failedVerify = 0
  let dryRunCount = 0

  if (targetBookId) {
    const { data: book, error } = await (supabase.from('books') as any)
      .select('id, title')
      .eq('id', targetBookId)
      .single()
    if (error || !book) {
      throw new Error(`Book not found: ${targetBookId}`)
    }

    scanned = 1
    const res = await repairBookBackCover(book as BookRow, adminUserId, selectCols)
    if (res.status === 'repaired') repaired++
    if (res.status === 'skipped_exists') skipped++
    if (res.status === 'not_found') notFound++
    if (res.status === 'failed_verify') failedVerify++
    if (res.status === 'dry_run') dryRunCount++

    console.log('Result:', res)
  } else {
    const batchSize = 200
    let offset = 0

    while (true) {
      const books = await listBooksBatch(offset, batchSize)
      if (books.length === 0) break

      for (const book of books) {
        scanned++
        try {
          const res = await repairBookBackCover(book, adminUserId, selectCols)
          switch (res.status) {
            case 'repaired':
              repaired++
              console.log(`✅ repaired ${book.id} (${book.title || 'Untitled'}) -> ${res.imageId}`)
              break
            case 'skipped_exists':
              skipped++
              break
            case 'dry_run':
              dryRunCount++
              console.log(`🧪 dry-run ${book.id} -> ${res.imageId}`)
              break
            case 'not_found':
              notFound++
              break
            case 'failed_verify':
              failedVerify++
              console.warn(`⚠️ verify failed ${book.id} -> ${res.imageId}`)
              break
          }
        } catch (err: any) {
          console.warn(`⚠️ error for book ${book.id}:`, err?.message || err)
        }
      }

      offset += books.length
      // Short progress tick
      if (offset % (batchSize * 5) === 0) {
        console.log(`...progress scanned=${scanned} repaired=${repaired} skipped=${skipped}`)
      }
    }
  }

  console.log('\n✅ Done')
  console.log(
    JSON.stringify(
      { scanned, repaired, skipped, notFound, failedVerify, dryRun: dryRunCount },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error('❌ Repair script failed:', err)
  process.exit(1)
})

