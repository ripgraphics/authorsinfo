import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.ISBNDB_API_KEY;
  const baseUrl = 'https://api2.isbndb.com';
  const query = 'programming'; // Example query

  if (!apiKey) {
    console.error('ISBNdb API key is not defined.');
    return NextResponse.json({ error: 'API key is not defined' }, { status: 500 });
  }

  try {
    console.log('Fetching books with API key:', apiKey);
    const response = await fetch(`${baseUrl}/books/${query}?pageSize=3`, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to fetch books:', response.status, text);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Internal server error fetching books:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 