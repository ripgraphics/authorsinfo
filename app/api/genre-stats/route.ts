/**
 * Genre Analytics API
 * GET /api/genre-stats - Get genre distribution and preferences
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Genre color mapping
const genreColors: Record<string, string> = {
  'fiction': 'hsl(var(--chart-1))',
  'non-fiction': 'hsl(var(--chart-2))',
  'mystery': 'hsl(var(--chart-3))',
  'thriller': 'hsl(var(--chart-4))',
  'romance': 'hsl(var(--chart-5))',
  'fantasy': 'hsl(var(--primary))',
  'science fiction': 'hsl(var(--secondary))',
  'horror': 'hsl(var(--foreground))',
  'biography': 'hsl(var(--ring))',
  'history': 'hsl(var(--accent))',
  'self-help': 'hsl(var(--chart-2))',
  'business': 'hsl(var(--chart-5))',
  'science': 'hsl(var(--chart-3))',
  'poetry': 'hsl(var(--chart-4))',
  'children': 'hsl(var(--chart-1))',
  'young adult': 'hsl(var(--chart-5))',
  'graphic novel': 'hsl(var(--chart-2))',
  'memoir': 'hsl(var(--ring))',
  'philosophy': 'hsl(var(--muted-foreground))',
  'religion': 'hsl(var(--accent))',
};

// GET /api/genre-stats - Get genre statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get genre stats from cache table
    const { data: genreStats, error: genreError } = await supabase
      .from('genre_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('books_read', { ascending: false });

    // If no cached stats, calculate from sessions
    if (!genreStats || genreStats.length === 0) {
      // Get sessions with book info
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select(`
          pages_read,
          duration_minutes,
          books (
            id,
            genre
          )
        `)
        .eq('user_id', user.id);

      // Aggregate by genre
      const genreMap: Record<string, { 
        books: Set<string>; 
        pages: number; 
        minutes: number;
      }> = {};

      sessions?.forEach((s: any) => {
        const genre = s.books?.genre;
        if (genre) {
          if (!genreMap[genre]) {
            genreMap[genre] = { books: new Set(), pages: 0, minutes: 0 };
          }
          if (s.books?.id) genreMap[genre].books.add(s.books.id);
          genreMap[genre].pages += s.pages_read || 0;
          genreMap[genre].minutes += s.duration_minutes || 0;
        }
      });

      // Convert to array
      const calculatedStats = Object.entries(genreMap).map(([genre, stats]) => ({
        genre,
        booksRead: stats.books.size,
        pagesRead: stats.pages,
        totalMinutes: stats.minutes,
      }));

      const totalBooks = calculatedStats.reduce((sum, s) => sum + s.booksRead, 0);
      
      const distribution = calculatedStats
        .sort((a, b) => b.booksRead - a.booksRead)
        .map(s => ({
          genre: s.genre,
          count: s.booksRead,
          percentage: totalBooks > 0 ? (s.booksRead / totalBooks) * 100 : 0,
          totalPages: s.pagesRead,
          totalMinutes: s.totalMinutes,
          color: genreColors[s.genre.toLowerCase()] || 'hsl(var(--muted-foreground))',
        }));

      return NextResponse.json({
        success: true,
        data: {
          distribution,
          totalGenres: distribution.length,
          totalBooks,
          topGenre: distribution[0] || null,
        },
      });
    }

    // Use cached stats
    const totalBooks = genreStats.reduce((sum: number, s: any) => sum + (s.books_read || 0), 0);
    
    const distribution = genreStats.map((s: any) => ({
      genre: s.genre,
      count: s.books_read || 0,
      percentage: totalBooks > 0 ? ((s.books_read || 0) / totalBooks) * 100 : 0,
      totalPages: s.pages_read || 0,
      totalMinutes: s.total_minutes || 0,
      avgRating: s.avg_rating,
      lastReadAt: s.last_read_at,
      color: genreColors[s.genre.toLowerCase()] || 'hsl(var(--muted-foreground))',
    }));

    return NextResponse.json({
      success: true,
      data: {
        distribution,
        totalGenres: distribution.length,
        totalBooks,
        topGenre: distribution[0] || null,
        summary: {
          mostRead: distribution[0]?.genre,
          leastRead: distribution[distribution.length - 1]?.genre,
          avgGenresPerYear: Math.min(distribution.length, 12),
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/genre-stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

