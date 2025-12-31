/**
 * Recommendations API
 * GET - Fetch personalized recommendations for the current user
 * POST - Generate new recommendations (force refresh)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { 
  Recommendation, 
  RecommendationsResponse, 
  RecommendationType,
  RecommendationReasonType 
} from '@/types/phase3';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as RecommendationType | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const cursor = searchParams.get('cursor');
    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];
    const genres = searchParams.get('genres')?.split(',').filter(Boolean);
    const minRating = parseFloat(searchParams.get('minRating') || '0');

    // Try to get cached recommendations first
    let query = supabase
      .from('recommendation_cache')
      .select(`
        id,
        book_id,
        recommendation_type,
        score,
        reason,
        reason_type,
        source_book_id,
        rank,
        was_viewed,
        was_clicked,
        was_dismissed,
        expires_at,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('was_dismissed', false)
      .gt('expires_at', new Date().toISOString())
      .order('score', { ascending: false });

    if (type) {
      query = query.eq('recommendation_type', type);
    }

    if (excludeIds.length > 0) {
      query = query.not('book_id', 'in', `(${excludeIds.join(',')})`);
    }

    if (cursor) {
      query = query.lt('score', parseFloat(cursor));
    }

    query = query.limit(limit);

    const { data: cachedRecs, error: cacheError } = await query;

    let recommendations: Recommendation[] = [];
    let total = 0;

    if (cachedRecs && cachedRecs.length > 0) {
      // Get book details for cached recommendations
      const bookIds = cachedRecs.map(r => r.book_id);
      const sourceBookIds = cachedRecs.map(r => r.source_book_id).filter(Boolean);
      const allBookIds = [...new Set([...bookIds, ...sourceBookIds])];

      const { data: books } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          author_id,
          cover_image_id,
          genre,
          average_rating,
          review_count,
          pages,
          synopsis,
          cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
        `)
        .in('id', allBookIds);

      const booksMap = new Map((books as any[] || []).map((b: any) => [b.id, b]));

      recommendations = cachedRecs.map(rec => {
        const book = booksMap.get(rec.book_id) as any;
        const sourceBook = rec.source_book_id ? booksMap.get(rec.source_book_id) as any : undefined;
        
        // Handle cover_image - can be array or object from Supabase join
        const bookCoverImage = Array.isArray(book?.cover_image) 
          ? book.cover_image[0] 
          : book?.cover_image;
        const sourceCoverImage = Array.isArray(sourceBook?.cover_image) 
          ? sourceBook.cover_image[0] 
          : sourceBook?.cover_image;

        return {
          id: rec.id,
          bookId: rec.book_id,
          score: parseFloat(rec.score?.toString() || '0'),
          reason: rec.reason || generateDefaultReason(rec.reason_type as RecommendationReasonType),
          reasonType: rec.reason_type as RecommendationReasonType,
          sourceBookId: rec.source_book_id,
          sourceBook: sourceBook ? {
            id: sourceBook.id,
            title: sourceBook.title,
            cover_image_url: sourceCoverImage?.url
          } : undefined,
          rank: rec.rank,
          book: book ? {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: bookCoverImage?.url,
            cover_image: bookCoverImage,
            genre: book.genre,
            average_rating: book.average_rating,
            review_count: book.review_count,
            pages: book.pages,
            synopsis: book.synopsis
          } : {
            id: rec.book_id,
            title: 'Unknown Book'
          }
        };
      });

      // Filter by genres and rating if specified
      if (genres && genres.length > 0) {
        recommendations = recommendations.filter(r => 
          r.book.genre && genres.some(g => 
            r.book.genre?.toLowerCase().includes(g.toLowerCase())
          )
        );
      }

      if (minRating > 0) {
        recommendations = recommendations.filter(r => 
          (r.book.average_rating || 0) >= minRating
        );
      }

      // Get total count
      const { count } = await supabase
        .from('recommendation_cache')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('was_dismissed', false)
        .gt('expires_at', new Date().toISOString());

      total = count || recommendations.length;
    } else {
      // Generate fresh recommendations if cache is empty
      recommendations = await generateFreshRecommendations(supabase, user.id, limit, excludeIds);
      total = recommendations.length;
    }

    const response: RecommendationsResponse = {
      recommendations,
      total,
      hasMore: recommendations.length === limit,
      nextCursor: recommendations.length > 0 
        ? recommendations[recommendations.length - 1].score.toString() 
        : undefined,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear old recommendations
    await supabase
      .from('recommendation_cache')
      .delete()
      .eq('user_id', user.id);

    // Generate fresh recommendations
    const recommendations = await generateFreshRecommendations(supabase, user.id, 30, []);

    // Cache them
    if (recommendations.length > 0) {
      const cacheEntries = recommendations.map((rec, index) => ({
        user_id: user.id,
        book_id: rec.bookId,
        recommendation_type: 'personalized',
        score: rec.score,
        reason: rec.reason,
        reason_type: rec.reasonType,
        source_book_id: rec.sourceBookId,
        rank: index + 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));

      await supabase
        .from('recommendation_cache')
        .upsert(cacheEntries, { 
          onConflict: 'user_id,book_id,recommendation_type' 
        });
    }

    const response: RecommendationsResponse = {
      recommendations,
      total: recommendations.length,
      hasMore: false,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// Helper function to generate fresh recommendations
async function generateFreshRecommendations(
  supabase: any,
  userId: string,
  limit: number,
  excludeIds: string[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get user's reading history
  const { data: readingHistory } = await supabase
    .from('reading_progress')
    .select('book_id, status')
    .eq('user_id', userId);

  const readBookIds = new Set((readingHistory || []).map((r: any) => r.book_id));
  const allExcludeIds = [...excludeIds, ...Array.from(readBookIds)];

  // Get user's preferred genres from reading history
  const { data: genreData } = await supabase
    .from('reading_progress')
    .select(`
      books!inner(genre)
    `)
    .eq('user_id', userId)
    .in('status', ['reading', 'completed'])
    .not('books.genre', 'is', null);

  const genreCounts = new Map<string, number>();
  (genreData || []).forEach((item: any) => {
    const genre = item.books?.genre;
    if (genre) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    }
  });

  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  // Get user's preferred authors
  const { data: authorData } = await supabase
    .from('reading_progress')
    .select(`
      books!inner(author_id, author)
    `)
    .eq('user_id', userId)
    .in('status', ['reading', 'completed'])
    .not('books.author_id', 'is', null);

  const authorCounts = new Map<string, { id: string; name: string; count: number }>();
  (authorData || []).forEach((item: any) => {
    const authorId = item.books?.author_id;
    const authorName = item.books?.author;
    if (authorId) {
      const existing = authorCounts.get(authorId);
      if (existing) {
        existing.count++;
      } else {
        authorCounts.set(authorId, { id: authorId, name: authorName || 'Unknown', count: 1 });
      }
    }
  });

  const topAuthors = Array.from(authorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 1. Genre-based recommendations
  if (topGenres.length > 0) {
    const { data: genreBooks } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        author_id,
        cover_image_id,
        genre,
        average_rating,
        review_count,
        pages,
        synopsis,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
      `)
      .in('genre', topGenres)
      .gte('average_rating', 3.5)
      .order('average_rating', { ascending: false })
      .limit(Math.ceil(limit * 0.4));

    (genreBooks || []).forEach((book: any, index: number) => {
      if (!allExcludeIds.includes(book.id) && recommendations.length < limit) {
        recommendations.push({
          id: `genre-${book.id}`,
          bookId: book.id,
          score: 0.8 - (index * 0.01),
          reason: `Matches your interest in ${book.genre}`,
          reasonType: 'genre_match',
          rank: recommendations.length + 1,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating,
            review_count: book.review_count,
            pages: book.pages,
            synopsis: book.synopsis
          }
        });
        allExcludeIds.push(book.id);
      }
    });
  }

  // 2. Author-based recommendations
  if (topAuthors.length > 0) {
    const authorIds = topAuthors.map(a => a.id);
    const { data: authorBooks } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        author_id,
        cover_image_id,
        genre,
        average_rating,
        review_count,
        pages,
        synopsis,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
      `)
      .in('author_id', authorIds)
      .order('average_rating', { ascending: false })
      .limit(Math.ceil(limit * 0.3));

    (authorBooks || []).forEach((book: any, index: number) => {
      if (!allExcludeIds.includes(book.id) && recommendations.length < limit) {
        const authorInfo = topAuthors.find(a => a.id === book.author_id);
        recommendations.push({
          id: `author-${book.id}`,
          bookId: book.id,
          score: 0.75 - (index * 0.01),
          reason: `More from ${authorInfo?.name || book.author || 'authors you enjoy'}`,
          reasonType: 'author_match',
          rank: recommendations.length + 1,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating,
            review_count: book.review_count,
            pages: book.pages,
            synopsis: book.synopsis
          }
        });
        allExcludeIds.push(book.id);
      }
    });
  }

  // 3. Highly rated books (fallback/filler)
  if (recommendations.length < limit) {
    const { data: topRatedBooks } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        author_id,
        cover_image_id,
        genre,
        average_rating,
        review_count,
        pages,
        synopsis,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
      `)
      .gte('average_rating', 4.0)
      .gte('review_count', 5)
      .order('average_rating', { ascending: false })
      .limit(limit - recommendations.length + 5);

    (topRatedBooks || []).forEach((book: any, index: number) => {
      if (!allExcludeIds.includes(book.id) && recommendations.length < limit) {
        recommendations.push({
          id: `rated-${book.id}`,
          bookId: book.id,
          score: 0.6 - (index * 0.01),
          reason: `Highly rated (${book.average_rating?.toFixed(1)}★) by the community`,
          reasonType: 'highly_rated',
          rank: recommendations.length + 1,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating,
            review_count: book.review_count,
            pages: book.pages,
            synopsis: book.synopsis
          }
        });
        allExcludeIds.push(book.id);
      }
    });
  }

  // Sort by score and update ranks
  recommendations.sort((a, b) => b.score - a.score);
  recommendations.forEach((rec, index) => {
    rec.rank = index + 1;
  });

  return recommendations.slice(0, limit);
}

function generateDefaultReason(reasonType: RecommendationReasonType): string {
  const reasons: Record<RecommendationReasonType, string> = {
    genre_match: 'Matches your favorite genres',
    author_match: 'From authors you enjoy',
    similar_to: 'Similar to books you\'ve read',
    trending: 'Trending right now',
    friends_read: 'Your friends are reading this',
    highly_rated: 'Highly rated by the community',
    new_release: 'New release you might like',
    because_you_read: 'Because you enjoyed similar books'
  };
  return reasons[reasonType] || 'Recommended for you';
}

