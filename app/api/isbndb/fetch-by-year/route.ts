import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { subject, year, page = 1, pageSize = 100 } = await request.json();
    
    // Validate subject and year
    if (typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Invalid subject provided' }, { status: 400 });
    }
    
    const pubYear = typeof year === 'string' ? year.trim() : '';
    if (!/^[0-9]{4}$/.test(pubYear)) {
      return NextResponse.json({ error: 'Invalid year provided' }, { status: 400 });
    }

    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
      console.error('ISBNdb API key is not defined.');
      return NextResponse.json({ error: 'API key is not defined' }, { status: 500 });
    }

    const baseUrl = 'https://api2.isbndb.com';
    
    // Use the subject as the search path and filter by subjects column
    const urlObj = new URL(`${baseUrl}/books/${encodeURIComponent(subject.trim())}`);
    urlObj.searchParams.set('column', 'subjects');
    // Filter results by the publication year
    urlObj.searchParams.set('year', pubYear);
    urlObj.searchParams.set('shouldMatchAll', '0');
    urlObj.searchParams.set('pageSize', String(pageSize));
    urlObj.searchParams.set('page', String(page));

    // Build URL with query and date filter
    // const urlObj = new URL(`${baseUrl}/books/${encodeURIComponent(year.trim())}`);
    // Search only in date_published column and filter by publication year
    // urlObj.searchParams.set('column', 'date_published');
    // urlObj.searchParams.set('year', year.trim());

    // ... rest of the code remains unchanged ...
    
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: 'An error occurred while fetching books' }, { status: 500 });
  }
} 