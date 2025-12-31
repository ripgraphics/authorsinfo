import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  if (!query.trim()) {
    return NextResponse.json({ authors: [] })
  }

  const apiKey = process.env.ISBNDB_API_KEY
  if (!apiKey) {
    console.error('ISBNdb API key is not defined.')
    return NextResponse.json({ authors: [] }, { status: 500 })
  }

  const baseUrl = 'https://api2.isbndb.com'
  try {
    const response = await fetch(`${baseUrl}/authors/${encodeURIComponent(query)}?pageSize=10`, {
      headers: { Authorization: apiKey },
    })
    if (!response.ok) {
      console.error('Failed to fetch authors from ISBNdb:', response.status)
      return NextResponse.json({ authors: [] }, { status: response.status })
    }
    const data = (await response.json()) as { authors: string[] }
    return NextResponse.json({ authors: data.authors || [] })
  } catch (error) {
    console.error('Error fetching authors from ISBNdb:', error)
    return NextResponse.json({ authors: [] }, { status: 500 })
  }
}

