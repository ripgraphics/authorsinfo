import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { authorName, page = 1, pageSize = 100 } = await request.json();
  if (typeof authorName !== 'string' || !authorName.trim()) {
    return NextResponse.json({ error: 'No author name provided' }, { status: 400 });
  }

  const apiKey = process.env.ISBNDB_API_KEY;
  if (!apiKey) {
    console.error('ISBNdb API key is not defined.');
    return NextResponse.json({ error: 'API key is not defined' }, { status: 500 });
  }

  const baseUrl = 'https://api2.isbndb.com';

  try {
    const response = await fetch(
      `${baseUrl}/author/${encodeURIComponent(authorName)}?pageSize=${pageSize}&page=${page}`,
      { headers: { Authorization: apiKey } }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error fetching books for author ${authorName}:`, response.status, text);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: response.status });
    }

    const data = await response.json();
    // data.books should be array of books
    return NextResponse.json({ books: data.books });
  } catch (error) {
    console.error('Internal server error fetching books by author:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 