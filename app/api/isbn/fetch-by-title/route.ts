import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { query, page = 1, pageSize = 100 } = await request.json();
  if (typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'No query provided' }, { status: 400 });
  }

  const apiKey = process.env.ISBNDB_API_KEY;
  if (!apiKey) {
    console.error('ISBNdb API key is not defined.');
    return NextResponse.json({ error: 'API key is not defined' }, { status: 500 });
  }

  const baseUrl = 'https://api2.isbndb.com';

  try {
    const response = await fetch(
      `${baseUrl}/books/${encodeURIComponent(query)}?pageSize=${pageSize}&page=${page}`,
      { headers: { Authorization: apiKey } }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Error fetching books by title:', response.status, text);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ books: data.books, total: data.total });
  } catch (error) {
    console.error('Internal server error fetching books by title:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 