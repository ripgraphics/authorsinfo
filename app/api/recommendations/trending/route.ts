/**
 * Trending Books API
 * GET - Fetch trending books for a specific period
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { TrendingBook, TrendingBooksResponse, TrendPeriod } from '@/types/phase3';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'weekly') as TrendPeriod;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const genre = searchParams.get('genre');

    // Calculate period boundaries
    const now = new Date();
    let periodStart: Date;
    
    switch (period) {
      case 'hourly':
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'daily':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Try to get from cache first
    const { data: cachedTrending } = await supabase
      .from('trending_books')
      .select('*')
      .eq('period', period)
      .gte('period_start', periodStart.toISOString())
      .order('rank', { ascending: true })
      .limit(limit);

    let trendingBooks: TrendingBook[] = [];

    if (cachedTrending && cachedTrending.length > 0) {
      // Get book details
      const bookIds = cachedTrending.map((t: any) => t.book_id);
      
      const { data: books } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          genre,
          average_rating,
          cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
        `)
        .in('id', bookIds);

      const booksMap = new Map((books as any[] || []).map((b: any) => [b.id, b]));

      trendingBooks = cachedTrending.map((t: any) => {
        const book = booksMap.get(t.book_id) as any;
        return {
          id: t.id,
          bookId: t.book_id,
          period: t.period as TrendPeriod,
          viewsCount: t.views_count || 0,
          addsCount: t.adds_count || 0,
          readsStarted: t.reads_started || 0,
          readsCompleted: t.reads_completed || 0,
          reviewsCount: t.reviews_count || 0,
          avgRating: parseFloat(t.avg_rating?.toString() || '0'),
          discussionsCount: t.discussions_count || 0,
          trendScore: parseFloat(t.trend_score?.toString() || '0'),
          rank: t.rank,
          previousRank: t.previous_rank,
          rankChange: t.rank_change || 0,
          periodStart: new Date(t.period_start),
          periodEnd: new Date(t.period_end),
          calculatedAt: new Date(t.calculated_at),
          book: book ? {
            id: book.id,
            title: book.title,
            author: book.author,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating
          } : undefined
        };
      });

      // Filter by genre if specified
      if (genre) {
        trendingBooks = trendingBooks.filter(t => 
          t.book?.genre?.toLowerCase().includes(genre.toLowerCase())
        );
      }
    } else {
      // Generate trending from activity data
      trendingBooks = await calculateTrendingBooks(supabase, period, periodStart, now, limit, genre);
    }

    const response: TrendingBooksResponse = {
      period,
      books: trendingBooks,
      periodStart,
      periodEnd: now,
      total: trendingBooks.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching trending books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending books' },
      { status: 500 }
    );
  }
}

async function calculateTrendingBooks(
  supabase: any,
  period: TrendPeriod,
  periodStart: Date,
  periodEnd: Date,
  limit: number,
  genre?: string | null
): Promise<TrendingBook[]> {
  // Get books with recent reading activity
  let query = supabase
    .from('reading_progress')
    .select(`
      book_id,
      status,
      created_at,
      books!inner(
        id,
        title,
        author,
        genre,
        average_rating,
        review_count,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
      )
    `)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  if (genre) {
    query = query.ilike('books.genre', `%${genre}%`);
  }

  const { data: readingActivity } = await query;

  // Aggregate by book
  const bookStats = new Map<string, {
    book: any;
    readsStarted: number;
    readsCompleted: number;
    currentReaders: number;
  }>();

  (readingActivity || []).forEach((activity: any) => {
    const bookId = activity.book_id;
    const book = activity.books;
    
    if (!bookStats.has(bookId)) {
      bookStats.set(bookId, {
        book,
        readsStarted: 0,
        readsCompleted: 0,
        currentReaders: 0
      });
    }
    
    const stats = bookStats.get(bookId)!;
    if (activity.status === 'reading') {
      stats.readsStarted++;
      stats.currentReaders++;
    } else if (activity.status === 'completed') {
      stats.readsCompleted++;
    }
  });

  // Get review counts for these books
  const bookIds = Array.from(bookStats.keys());
  
  if (bookIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('book_id')
      .in('book_id', bookIds)
      .gte('created_at', periodStart.toISOString());

    const reviewCounts = new Map<string, number>();
    (reviews || []).forEach((r: any) => {
      reviewCounts.set(r.book_id, (reviewCounts.get(r.book_id) || 0) + 1);
    });

    // Calculate trend scores
    const trendingBooks: TrendingBook[] = [];
    
    bookStats.forEach((stats, bookId) => {
      const reviewCount = reviewCounts.get(bookId) || 0;
      
      // Weighted trend score
      const trendScore = 
        (stats.readsStarted * 3) + 
        (stats.readsCompleted * 5) + 
        (stats.currentReaders * 2) + 
        (reviewCount * 4) +
        ((stats.book?.average_rating || 0) * 2);

      trendingBooks.push({
        id: `trend-${bookId}`,
        bookId,
        period,
        viewsCount: 0, // Would need view tracking
        addsCount: stats.readsStarted,
        readsStarted: stats.readsStarted,
        readsCompleted: stats.readsCompleted,
        reviewsCount: reviewCount,
        avgRating: stats.book?.average_rating || 0,
        discussionsCount: 0, // Would need discussion tracking
        trendScore,
        rank: 0,
        previousRank: undefined,
        rankChange: 0,
        periodStart,
        periodEnd,
        calculatedAt: new Date(),
        book: stats.book ? {
          id: stats.book.id,
          title: stats.book.title,
          author: stats.book.author,
          cover_image_url: stats.book.cover_image?.url,
          cover_image: stats.book.cover_image,
          genre: stats.book.genre,
          average_rating: stats.book.average_rating
        } : undefined
      });
    });

    // Sort by trend score and assign ranks
    trendingBooks.sort((a, b) => b.trendScore - a.trendScore);
    trendingBooks.forEach((book, index) => {
      book.rank = index + 1;
    });

    return trendingBooks.slice(0, limit);
  }

  // Fallback: return highly rated books if no activity
  const { data: fallbackBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      genre,
      average_rating,
      review_count,
      cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
    `)
    .gte('average_rating', 4.0)
    .order('average_rating', { ascending: false })
    .limit(limit);

  return (fallbackBooks || []).map((book: any, index: number) => ({
    id: `fallback-${book.id}`,
    bookId: book.id,
    period,
    viewsCount: 0,
    addsCount: 0,
    readsStarted: 0,
    readsCompleted: 0,
    reviewsCount: book.review_count || 0,
    avgRating: book.average_rating || 0,
    discussionsCount: 0,
    trendScore: (book.average_rating || 0) * 10,
    rank: index + 1,
    previousRank: undefined,
    rankChange: 0,
    periodStart,
    periodEnd,
    calculatedAt: new Date(),
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      cover_image_url: book.cover_image?.url,
      cover_image: book.cover_image,
      genre: book.genre,
      average_rating: book.average_rating
    }
  }));
}
