import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    let queryDb = supabaseAdmin
      .from('authors')
      .select('id, name')
      .order('name', { ascending: true })
    if (search) {
      queryDb = queryDb.ilike('name', `%${search}%`)
    }
    queryDb = queryDb.limit(10)
    const { data: authors, error } = await queryDb
    if (error) {
      console.error('Error fetching DB authors:', error)
      return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 })
    }
    return NextResponse.json({ authors: authors || [] })
  } catch (err) {
    console.error('Internal server error in DB authors route:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

