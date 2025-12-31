'use client';

/**
 * SimilarBooksSection Component
 * Displays books similar to a specific book
 * 
 * Features:
 * - Auto-fetches similar books on mount
 * - Grid or carousel layout
 * - Shows similarity scores (optional)
 * - Loading and empty states
 * 
 * @example
 * <SimilarBooksSection 
 *   bookId="book-123"
 *   currentBookTitle="The Great Gatsby"
 *   limit={6}
 *   onBookClick={(id) => router.push(`/books/${id}`)}
 * />
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecommendationStore } from '@/lib/stores/recommendation-store';
import type { SimilarBook, SimilarBooksSectionProps } from '@/types/phase3';

// Re-export types for consumers
export type { SimilarBook, SimilarBooksSectionProps };

export function SimilarBooksSection({
  bookId,
  currentBookTitle,
  limit = 6,
  showHeader = true,
  onBookClick,
  className
}: SimilarBooksSectionProps) {
  const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from store if available, otherwise direct API call
  const storeSimilarBooks = useRecommendationStore(state => state.similarBooks[bookId]);
  const fetchSimilarBooks = useRecommendationStore(state => state.fetchSimilarBooks);

  useEffect(() => {
    const loadSimilarBooks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check store first
        if (storeSimilarBooks && storeSimilarBooks.length > 0) {
          setSimilarBooks(storeSimilarBooks.slice(0, limit));
          setIsLoading(false);
          return;
        }

        // Fetch from API
        await fetchSimilarBooks({ bookId, limit });
        
        // Get updated store value
        const updated = useRecommendationStore.getState().similarBooks[bookId];
        setSimilarBooks(updated?.slice(0, limit) || []);
      } catch (err) {
        console.error('Error loading similar books:', err);
        setError('Failed to load similar books');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) {
      loadSimilarBooks();
    }
  }, [bookId, limit, fetchSimilarBooks, storeSimilarBooks]);

  const handleBookClick = (similarBookId: string) => {
    onBookClick?.(similarBookId);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-3 w-3/4 mt-1" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className={cn('space-y-4', className)}>
        {showHeader && <h3 className="text-lg font-semibold">Similar Books</h3>}
        <div className="text-center py-8 text-muted-foreground">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (!similarBooks || similarBooks.length === 0) {
    return (
      <section className={cn('space-y-4', className)}>
        {showHeader && <h3 className="text-lg font-semibold">Similar Books</h3>}
        <div className="flex flex-col items-center justify-center py-8 bg-muted/30 rounded-lg">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            No similar books found yet
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {currentBookTitle 
              ? `Similar to "${currentBookTitle.length > 30 ? currentBookTitle.substring(0, 30) + '...' : currentBookTitle}"`
              : 'Similar Books'}
          </h3>
          {similarBooks.length >= limit && (
            <Button variant="ghost" size="sm" className="gap-1">
              View more
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Grid of similar books */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {similarBooks.map((similar) => {
          const book = similar.book;
          if (!book) return null;

          const coverUrl = book.cover_image?.url || book.cover_image_url || '/images/book-placeholder.png';

          return (
            <Card 
              key={similar.bookId}
              className="overflow-hidden group cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleBookClick(similar.bookId)}
            >
              <Link href={`/books/${similar.bookId}`}>
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <Image
                    src={coverUrl}
                    alt={book.title || 'Book cover'}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 16vw, 12vw"
                  />
                  
                  {/* Similarity score badge */}
                  {similar.similarityScore > 0.7 && (
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-black/70 text-white text-xs px-1.5 py-0.5"
                      >
                        {Math.round(similar.similarityScore * 100)}% match
                      </Badge>
                    </div>
                  )}
                </div>
              </Link>
              
              <CardContent className="p-2.5">
                <Link href={`/books/${similar.bookId}`}>
                  <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                    {book.title}
                  </h4>
                </Link>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {book.author}
                </p>
                
                <div className="flex items-center justify-between mt-1.5">
                  {book.average_rating ? (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{book.average_rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span />
                  )}
                  
                  {book.genre && (
                    <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                      {book.genre}
                    </span>
                  )}
                </div>

                {/* Match indicators */}
                {(similar.genreMatch > 0.8 || similar.authorMatch > 0.8) && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {similar.authorMatch > 0.8 && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Same author
                      </Badge>
                    )}
                    {similar.genreMatch > 0.8 && similar.authorMatch <= 0.8 && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Same genre
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default SimilarBooksSection;
