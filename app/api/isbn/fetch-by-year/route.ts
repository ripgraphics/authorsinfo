import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { subject, year, page = 1, pageSize = 50 } = await request.json();
  // Validate subject and year
  if (typeof subject !== 'string' || !subject.trim()) {
    return NextResponse.json({ error: 'Invalid subject provided' }, { status: 400 });
  }
  if (typeof year !== 'string' || !/^\d{4}$/.test(year.trim())) {
    return NextResponse.json({ error: 'Invalid year provided' }, { status: 400 });
  }

  const apiKey = process.env.ISBNDB_API_KEY;
  if (!apiKey) {
    console.error('ISBNdb API key is not defined.');
    return NextResponse.json({ error: 'API key is not defined' }, { status: 500 });
  }

  const baseUrl = 'https://api2.isbndb.com';
  try {
    // Use subject as the path query and filter by subjects & year
    const urlObj = new URL(`${baseUrl}/books/${encodeURIComponent(subject.trim())}`);
    urlObj.searchParams.set('column', 'subjects');
    urlObj.searchParams.set('year', year.trim());
    urlObj.searchParams.set('shouldMatchAll', '0');
    urlObj.searchParams.set('pageSize', String(pageSize));
    urlObj.searchParams.set('page', String(page));
    const response = await fetch(urlObj.toString(), { headers: { Authorization: apiKey } });
    if (!response.ok) {
      const text = await response.text();
      console.error('Error fetching books by year:', response.status, text);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: response.status });
    }
    const data = await response.json();
    // Unwrap nested 'book' objects and normalize authors
    const allBooks = data.books || [];
    const outputBooks = allBooks.map((entry: any) => entry.book ?? entry);
    const normalized = outputBooks.map((b: any) => ({
      ...b,
      authors: Array.isArray(b.authors) ? b.authors : [],
    }));
    return NextResponse.json({ books: normalized, total: data.total ?? normalized.length });
  } catch (error) {
    console.error('Internal server error fetching books by year:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 