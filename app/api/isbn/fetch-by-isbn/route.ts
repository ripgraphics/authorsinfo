import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { isbns } = await request.json();
  if (!Array.isArray(isbns) || isbns.length === 0) {
    return NextResponse.json({ error: 'No ISBNs provided' }, { status: 400 });
  }

  const apiKey = process.env.ISBNDB_API_KEY;
  if (!apiKey) {
    console.error('ISBNdb API key is not defined.');
    return NextResponse.json({ error: 'API key is not defined' }, { status: 500 });
  }

  const baseUrl = 'https://api2.isbndb.com';
  const results: any[] = [];

  for (const isbn of isbns) {
    try {
      const res = await fetch(`${baseUrl}/book/${encodeURIComponent(isbn)}`, {
        headers: { Authorization: apiKey },
      });
      if (!res.ok) {
        console.error(`Error fetching ISBN ${isbn}:`, await res.text());
        continue;
      }
      const data = await res.json();
      if (data.book) {
        results.push(data.book);
      }
    } catch (err) {
      console.error(`Failed request for ISBN ${isbn}:`, err);
    }
  }

  return NextResponse.json({ books: results });
} 