import { supabaseAdmin } from '@/lib/supabase-admin'
import { Database } from '@/types/database'

export type Publisher = Database['public']['Tables']['publishers']['Row'] & {
  cover_image?: {
    id: number
    url: string
    alt_text: string
  }
  publisher_image?: {
    id: number
    url: string
    alt_text: string
  }
  country_details?: {
    id: number
    name: string
    code: string
  }
}

export async function getPublisher(id: string): Promise<Publisher | null> {
  try {
    const { data: publisher, error } = await supabaseAdmin
      .from('publishers')
      .select(
        `
        *,
        cover_image:cover_image_id(id, url, alt_text),
        publisher_image:publisher_image_id(id, url, alt_text),
        country_details:country_id(id, name, code)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching publisher:', error)
      return null
    }

    return publisher as Publisher
  } catch (error) {
    console.error('Unexpected error fetching publisher:', error)
    return null
  }
}

export async function getPublisherBooks(publisherId: string, page = 1, limit = 10) {
  try {
    const start = (page - 1) * limit
    const {
      data: books,
      error,
      count,
    } = await supabaseAdmin
      .from('books')
      .select(
        `
        *,
        cover_image:cover_image_id(id, url, alt_text),
        author:author_id(id, name)
      `,
        { count: 'exact' }
      )
      .eq('publisher_id', publisherId)
      .order('created_at', { ascending: false })
      .range(start, start + limit - 1)

    if (error) {
      console.error('Error fetching publisher books:', error)
      return { books: [], count: 0 }
    }

    return { books, count: count || 0 }
  } catch (error) {
    console.error('Unexpected error fetching publisher books:', error)
    return { books: [], count: 0 }
  }
}
