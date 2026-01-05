import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { EntityMetadata, EntityType } from '@/types/entity'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params
    const entityType = type as EntityType

    let metadata: EntityMetadata | null = null

    switch (entityType) {
      case 'author':
        metadata = await fetchAuthorMetadata(id)
        break
      case 'book':
        metadata = await fetchBookMetadata(id)
        break
      case 'publisher':
        metadata = await fetchPublisherMetadata(id)
        break
      case 'user':
        metadata = await fetchUserMetadata(id)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        )
    }

    if (!metadata) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching entity metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entity metadata' },
      { status: 500 }
    )
  }
}

async function fetchAuthorMetadata(id: string): Promise<EntityMetadata | null> {
  const { data: author } = await supabase
    .from('authors')
    .select('*')
    .eq('id', id)
    .single()

  if (!author) return null

  const { data: contact } = await supabase
    .from('contact_info')
    .select('*')
    .eq('entity_type', 'author')
    .eq('entity_id', id)
    .single()

  const { data: authorImage } = author.author_image_id
    ? await supabase
        .from('images')
        .select('*')
        .eq('id', author.author_image_id)
        .single()
    : { data: null }

  return {
    entityType: 'author',
    entityId: id,
    title: author.name,
    bio: author.biography,
    about: author.biography,
    website: author.website,
    contact: contact || undefined,
    socialLinks: {
      twitter: author.twitter_handle ? `https://twitter.com/${author.twitter_handle}` : undefined,
      facebook: author.facebook_handle ? `https://facebook.com/${author.facebook_handle}` : undefined,
      instagram: author.instagram_handle ? `https://instagram.com/${author.instagram_handle}` : undefined,
      goodreads: author.goodreads_url,
    },
    images: {
      primary: authorImage || undefined,
    },
    createdAt: author.created_at,
    updatedAt: author.updated_at,
  }
}

async function fetchBookMetadata(id: string): Promise<EntityMetadata | null> {
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (!book) return null

  const { data: bookImage } = book.cover_image_id
    ? await supabase
        .from('images')
        .select('*')
        .eq('id', book.cover_image_id)
        .single()
    : { data: null }

  return {
    entityType: 'book',
    entityId: id,
    title: book.title,
    synopsis: book.synopsis,
    about: book.overview,
    description: book.overview,
    website: book.website,
    images: {
      primary: bookImage || undefined,
    },
    entityData: {
      pages: book.pages,
      isbn: book.isbn13 || book.isbn10,
      language: book.language,
      publisher: book.publisher_id,
    },
    createdAt: book.created_at,
    updatedAt: book.updated_at,
  }
}

async function fetchPublisherMetadata(id: string): Promise<EntityMetadata | null> {
  const { data: publisher } = await supabase
    .from('publishers')
    .select('*')
    .eq('id', id)
    .single()

  if (!publisher) return null

  const { data: contact } = await supabase
    .from('contact_info')
    .select('*')
    .eq('entity_type', 'publisher')
    .eq('entity_id', id)
    .single()

  const { data: publisherImage } = publisher.publisher_image_id
    ? await supabase
        .from('images')
        .select('*')
        .eq('id', publisher.publisher_image_id)
        .single()
    : { data: null }

  return {
    entityType: 'publisher',
    entityId: id,
    title: publisher.name,
    about: publisher.about,
    bio: publisher.about,
    website: publisher.website,
    contact: contact || undefined,
    images: {
      primary: publisherImage || undefined,
    },
    entityData: {
      founded_year: publisher.founded_year,
    },
    createdAt: publisher.created_at,
    updatedAt: publisher.updated_at,
  }
}

async function fetchUserMetadata(id: string): Promise<EntityMetadata | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) return null

  const { data: userImage } = profile.profile_image_id
    ? await supabase
        .from('images')
        .select('*')
        .eq('id', profile.profile_image_id)
        .single()
    : { data: null }

  return {
    entityType: 'user',
    entityId: id,
    title: profile.display_name || profile.username || 'User',
    bio: profile.bio,
    about: profile.bio,
    website: profile.website,
    contact: {
      entity_type: 'user',
      entity_id: id,
      email: profile.email,
      phone: profile.phone,
      website: profile.website,
    },
    socialLinks: profile.social_links ? JSON.parse(profile.social_links) : undefined,
    images: {
      primary: userImage || undefined,
    },
    entityData: {
      location: profile.location,
      occupation: profile.occupation,
    },
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}
