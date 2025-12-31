'use client';

/**
 * TrendingSection Component
 * Displays trending books with period selection
 * 
 * Features:
 * - Period tabs (daily, weekly, monthly)
 * - Shows rank, rank change, and metrics
 * - Fire icon for hot books
 * - Loading and empty states
 * 
 * @example
 * <TrendingSection
 *   period="weekly"
 *   limit={10}
 *   showPeriodSelector
 *   onBookClick={(book) => router.push(`/books/${book.bookId}`)}
 * />
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Flame,
  BookOpen,
  Eye,
  BookmarkPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecommendationStore } from '@/lib/stores/recommendation-store';
import type { TrendingBook, TrendPeriod, TrendingSectionProps, TrendingBookCardProps } from '@/types/phase3';

// Re-export types for consumers
export type { TrendingBook, TrendPeriod, TrendingSectionProps, TrendingBookCardProps };

// Individual trending book card
export function TrendingBookCard({
  book,
  showRank = true,
  showRankChange = true,
  showMetrics = false,
  onClick,
  className
}: TrendingBookCardProps) {
  const coverUrl = book.book?.cover_image?.url || book.book?.cover_image_url || '/images/book-placeholder.png';
  
  const getRankChangeIcon = () => {
    if (!book.previousRank || book.rankChange === 0) {
      return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
    if (book.rankChange > 0) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    }
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  const isHot = book.rank <= 3 || book.trendScore > 50;

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group',
        className
      )}
      onClick={() => onClick?.(book)}
    >
      {/* Rank */}
      {showRank && (
        <div className="flex flex-col items-center justify-center w-8 flex-shrink-0">
          <span className={cn(
            'text-lg font-bold',
            book.rank === 1 && 'text-yellow-500',
            book.rank === 2 && 'text-gray-400',
            book.rank === 3 && 'text-amber-600',
            book.rank > 3 && 'text-muted-foreground'
          )}>
            {book.rank}
          </span>
          {showRankChange && book.previousRank && (
            <div className="flex items-center">
              {getRankChangeIcon()}
              {book.rankChange !== 0 && (
                <span className={cn(
                  'text-xs',
                  book.rankChange > 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {Math.abs(book.rankChange)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Book cover */}
      <Link href={`/books/${book.bookId}`} className="flex-shrink-0">
        <div className="relative h-16 w-11 rounded overflow-hidden">
          <Image
            src={coverUrl}
            alt={book.book?.title || 'Book cover'}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="44px"
          />
          {isHot && (
            <div className="absolute -top-1 -right-1">
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            </div>
          )}
        </div>
      </Link>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <Link href={`/books/${book.bookId}`}>
          <h4 className="font-medium text-sm truncate hover:text-primary transition-colors">
            {book.book?.title || 'Unknown Book'}
          </h4>
        </Link>
        <p className="text-xs text-muted-foreground truncate">
          {book.book?.author}
        </p>
        
        <div className="flex items-center gap-2 mt-1">
          {book.book?.average_rating && (
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{book.book.average_rating.toFixed(1)}</span>
            </div>
          )}
          {book.book?.genre && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {book.book.genre}
            </Badge>
          )}
        </div>

        {/* Metrics */}
        {showMetrics && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {book.readsStarted > 0 && (
              <div className="flex items-center gap-0.5">
                <BookOpen className="h-3 w-3" />
                <span>{book.readsStarted}</span>
              </div>
            )}
            {book.addsCount > 0 && (
              <div className="flex items-center gap-0.5">
                <BookmarkPlus className="h-3 w-3" />
                <span>{book.addsCount}</span>
              </div>
            )}
            {book.viewsCount > 0 && (
              <div className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                <span>{book.viewsCount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TrendingSection({
  period: initialPeriod,
  limit = 10,
  showPeriodSelector = true,
  onPeriodChange,
  onBookClick,
  className
}: TrendingSectionProps) {
  const [currentPeriod, setCurrentPeriod] = useState<TrendPeriod>(initialPeriod || 'weekly');
  
  const trendingBooks = useRecommendationStore(state => state.trendingBooks);
  const isLoading = useRecommendationStore(state => state.isLoadingTrending);
  const error = useRecommendationStore(state => state.trendingError);
  const fetchTrendingBooks = useRecommendationStore(state => state.fetchTrendingBooks);

  useEffect(() => {
    fetchTrendingBooks({ period: currentPeriod, limit });
  }, [currentPeriod, limit, fetchTrendingBooks]);

  const handlePeriodChange = (period: string) => {
    const newPeriod = period as TrendPeriod;
    setCurrentPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const handleBookClick = (book: TrendingBook) => {
    onBookClick?.(book);
  };

  const periodLabels: Record<TrendPeriod, string> = {
    hourly: 'Hour',
    daily: 'Today',
    weekly: 'Week',
    monthly: 'Month'
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            {showPeriodSelector && <Skeleton className="h-8 w-48" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-16 w-11" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load trending books</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!trendingBooks || trendingBooks.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No trending books yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Books
          </CardTitle>
          
          {showPeriodSelector && (
            <Tabs value={currentPeriod} onValueChange={handlePeriodChange}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs px-3 h-7">
                  {periodLabels.daily}
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-3 h-7">
                  {periodLabels.weekly}
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3 h-7">
                  {periodLabels.monthly}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1">
          {trendingBooks.slice(0, limit).map((book) => (
            <TrendingBookCard
              key={book.bookId}
              book={book}
              showRank
              showRankChange
              onClick={handleBookClick}
            />
          ))}
        </div>

        {trendingBooks.length > limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View all trending
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TrendingSection;
