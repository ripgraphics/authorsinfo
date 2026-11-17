import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Publisher } from '@/types/database'
import type { Author } from '@/types/book'
import { ClientPublisherPage } from './client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getFollowers, getFollowersCount } from '@/lib/follows-server'
import { supabaseAdmin } from '@/lib/supabase'

interface PublisherPageProps {
  params: {
    id: string
  }
}

async function getPublisher(id: string) {
  try {
    const publisher = await fetchQuery(api.queries.publishers.getPublisher, { id })
    if (!publisher) return null
    
    // Transform Convex publisher to match Supabase Publisher type
    return {
      id: publisher.supabaseId ?? publisher._id,
      name: publisher.name,
      website: publisher.website ?? undefined,
      cover_image_id: publisher.coverImageId ?? undefined,
      publisher_image_id: publisher.publisherImageId ?? undefined,
      country_id: publisher.countryId ?? undefined,
      created_at: new Date(publisher.createdAt).toISOString(),
      updated_at: new Date(publisher.updatedAt).toISOString(),
      cover_image: publisher.coverImageId ? {
        id: publisher.coverImageId,
        url: '', // Resolved via Convex fallback
        alt_text: publisher.name,
      } : null,
      publisher_image: publisher.publisherImageId ? {
        id: publisher.publisherImageId,
        url: '', // Resolved via Convex fallback
        alt_text: publisher.name,
      } : null,
      country_details: publisher.countryId ? {
        id: publisher.countryId,
        name: 'Unknown',
        code: 'XX',
      } : null,
    } as Publisher
  } catch (error) {
    console.error('Error fetching publisher from Convex:', error)
    return null
  }
}

async function getPublisherBooks(publisherId: string) {
  try {
    const { getBooksByPublisherIdFromConvex, transformConvexBookToSupabase } = await import('@/lib/convex-server')
    const books = await getBooksByPublisherIdFromConvex(publisherId, 12)
    return books.map(transformConvexBookToSupabase) as any[]
  } catch (error) {
    console.error('Error fetching publisher books from Convex:', error)
    return []
  }
}

async function getPublisherFollowers(publisherId: string) {
  try {
    // Get first 50 followers
    const { followers, count } = await getFollowers(publisherId, 'publisher', 1, 50)
    return { followers, count }
  } catch (error) {
    console.error('Error fetching publisher followers:', error)
    return { followers: [], count: 0 }
  }
}

export default async function PublisherPage({ params }: { params: Promise<{ id: string }> }) {
  // Wait for params to be properly resolved
  const { id } = await params

  // Get publisher data using the existing function
  const publisher = await getPublisher(id)

  if (!publisher) {
    notFound()
  }

  // Get publisher images from Convex (fallback when no album exists)
  let publisherImageUrl = ''
  let coverImageUrl = ''
  try {
    const { getPublisherImagesFromConvex } = await import('@/lib/convex-server')
    const images = await getPublisherImagesFromConvex(id)
    
    // Find logo/image - check alt_text containing 'publisher' or 'cover'
    const avatarImage = images?.find((img: any) => 
      img.image_type === 'publisher_logo' || 
      img.alt_text?.toLowerCase().includes('publisher') ||
      img.alt_text?.toLowerCase().includes('logo')
    )
    const coverImage = images?.find((img: any) => 
      img.image_type === 'publisher_cover' ||
      img.alt_text?.toLowerCase().includes('cover for publisher')
    )
    
    if (avatarImage && avatarImage.url) publisherImageUrl = avatarImage.url
    if (coverImage && coverImage.url) coverImageUrl = coverImage.url
  } catch (error) {
    console.error('Error fetching publisher images:', error)
  }

  // Fallback to Supabase data if Convex didn't find images
  if (!publisherImageUrl) {
    publisherImageUrl = publisher.publisher_image?.url || publisher.logo_url || '/placeholder.svg?height=200&width=200'
  }
  if (!coverImageUrl) {
    coverImageUrl = publisher.cover_image?.url || '/placeholder.svg?height=400&width=1200'
  }

  // Get publisher followers
  const { followers, count: followersCount } = await getPublisherFollowers(id)

  // Get publisher books with error handling
  let books: any[] = []
  try {
    books = await getPublisherBooks(id)
  } catch (error) {
    console.error('Error fetching publisher books:', error)
    books = []
  }

  // Get total book count for this publisher
  const totalBooksCount = await fetchQuery(api.queries.books.getBookCountByPublisherId, { publisherId: id })

  // Get publisher authors with error handling
  let authors: Author[] = []
  let authorsCount = 0
  try {
    const { getAuthorsByPublisherId } = await import('@/app/actions/data')
    authors = await getAuthorsByPublisherId(id)
    authorsCount = authors.length
  } catch (error) {
    console.error('Error fetching publisher authors:', error)
    authors = []
    authorsCount = 0
  }

  return (
    <ClientPublisherPage
      publisher={publisher}
      publisherImageUrl={publisherImageUrl}
      coverImageUrl={coverImageUrl}
      params={{ id }}
      followers={followers}
      followersCount={followersCount}
      books={books}
      booksCount={totalBooksCount || 0}
      authors={authors}
      authorsCount={authorsCount}
    />
  )
}
