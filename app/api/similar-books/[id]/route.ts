/**
 * Similar Books API
 * GET - Fetch books similar to the specified book
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { SimilarBook, SimilarBooksResponse } from '@/types/phase3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id: bookId } = await params;
    
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    const minScore = parseFloat(searchParams.get('minScore') || '0');

    // Try to get pre-computed similarities first
    const { data: similarities } = await supabase
      .from('book_similarity_scores')
      .select('*')
      .eq('book_id', bookId)
      .gte('overall_score', minScore)
      .order('overall_score', { ascending: false })
      .limit(limit);

    let similarBooks: SimilarBook[] = [];

    if (similarities && similarities.length > 0) {
      // Get book details for similar books
      const similarBookIds = similarities.map((s: any) => s.similar_book_id);
      
      const { data: books } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          author_id,
          genre,
          average_rating,
          pages,
          cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
        `)
        .in('id', similarBookIds);

      const booksMap = new Map((books as any[] || []).map((b: any) => [b.id, b]));

      similarBooks = similarities.map((s: any) => {
        const book = booksMap.get(s.similar_book_id) as any;
        return {
          bookId: s.similar_book_id,
          similarityScore: parseFloat(s.overall_score?.toString() || '0'),
          genreMatch: parseFloat(s.genre_score?.toString() || '0'),
          authorMatch: parseFloat(s.author_score?.toString() || '0'),
          book: book ? {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating,
            pages: book.pages
          } : undefined
        };
      });
    } else {
      // Generate similar books on-the-fly based on genre and author
      similarBooks = await generateSimilarBooks(supabase, bookId, limit);
    }

    const response: SimilarBooksResponse = {
      bookId,
      similarBooks,
      total: similarBooks.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching similar books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar books' },
      { status: 500 }
    );
  }
}

// Generate similar books based on genre and author matching
async function generateSimilarBooks(
  supabase: any,
  bookId: string,
  limit: number
): Promise<SimilarBook[]> {
  // Get the source book's details
  const { data: sourceBook } = await supabase
    .from('books')
    .select('id, genre, author_id, author, average_rating')
    .eq('id', bookId)
    .single();

  if (!sourceBook) {
    return [];
  }

  const similarBooks: SimilarBook[] = [];
  const addedBookIds = new Set<string>([bookId]);

  // 1. Same author, different book (highest similarity)
  if (sourceBook.author_id) {
    const { data: authorBooks } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        author_id,
        genre,
        average_rating,
        pages,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
      `)
      .eq('author_id', sourceBook.author_id)
      .neq('id', bookId)
      .order('average_rating', { ascending: false })
      .limit(Math.ceil(limit * 0.3));

    (authorBooks || []).forEach((book: any, index: number) => {
      if (!addedBookIds.has(book.id)) {
        const genreScore = book.genre === sourceBook.genre ? 1.0 : 0.3;
        similarBooks.push({
          bookId: book.id,
          similarityScore: 0.9 - (index * 0.05),
          genreMatch: genreScore,
          authorMatch: 1.0,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating,
            pages: book.pages
          }
        });
        addedBookIds.add(book.id);
      }
    });
  }

  // 2. Same genre, different author (medium similarity)
  if (sourceBook.genre) {
    const { data: genreBooks } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        author_id,
        genre,
        average_rating,
        pages,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
      `)
      .eq('genre', sourceBook.genre)
      .neq('id', bookId)
      .neq('author_id', sourceBook.author_id || '')
      .gte('average_rating', 3.5)
      .order('average_rating', { ascending: false })
      .limit(Math.ceil(limit * 0.5));

    (genreBooks || []).forEach((book: any, index: number) => {
      if (!addedBookIds.has(book.id) && similarBooks.length < limit) {
        similarBooks.push({
          bookId: book.id,
          similarityScore: 0.7 - (index * 0.03),
          genreMatch: 1.0,
          authorMatch: 0.0,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating,
            pages: book.pages
          }
        });
        addedBookIds.add(book.id);
      }
    });
  }

  // 3. Highly rated books as fallback
  if (similarBooks.length < limit) {
    const remaining = limit - similarBooks.length;
    const excludeIds = Array.from(addedBookIds);
    
    const { data: topBooks } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        author_id,
        genre,
        average_rating,
        pages,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text)
      `)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .gte('average_rating', 4.0)
      .order('average_rating', { ascending: false })
      .limit(remaining);

    (topBooks || []).forEach((book: any, index: number) => {
      if (!addedBookIds.has(book.id) && similarBooks.length < limit) {
        const genreScore = book.genre === sourceBook.genre ? 0.7 : 0.2;
        similarBooks.push({
          bookId: book.id,
          similarityScore: 0.5 - (index * 0.02),
          genreMatch: genreScore,
          authorMatch: 0.0,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            author_id: book.author_id,
            cover_image_url: book.cover_image?.url,
            cover_image: book.cover_image,
            genre: book.genre,
            average_rating: book.average_rating,
            pages: book.pages
          }
        });
        addedBookIds.add(book.id);
      }
    });
  }

  // Sort by similarity score
  similarBooks.sort((a, b) => b.similarityScore - a.similarityScore);

  return similarBooks.slice(0, limit);
}
