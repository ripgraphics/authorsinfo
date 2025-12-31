'use client';

/**
 * RecommendationCarousel Component
 * Horizontal scrollable carousel of recommendations
 * 
 * Features:
 * - Horizontal scroll with navigation arrows
 * - Loading skeleton state
 * - Empty state with customizable message
 * - View all link/action
 * - Feedback handling delegation
 * 
 * @example
 * <RecommendationCarousel
 *   title="Recommended for You"
 *   subtitle="Based on your reading history"
 *   recommendations={recommendations}
 *   showViewAll
 *   viewAllHref="/recommendations"
 *   onFeedback={handleFeedback}
 * />
 */

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecommendationCard } from './recommendation-card';
import type { 
  Recommendation, 
  FeedbackType, 
  RecommendationCarouselProps 
} from '@/types/phase3';

// Re-export types for consumers
export type { RecommendationCarouselProps };

export function RecommendationCarousel({
  title,
  subtitle,
  recommendations,
  loading = false,
  emptyMessage = 'No recommendations available yet. Start reading to get personalized suggestions!',
  showViewAll = false,
  viewAllHref,
  onViewAll,
  onItemClick,
  onFeedback,
  className
}: RecommendationCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position for arrow visibility
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [recommendations]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleFeedback = (bookId: string, feedbackType: FeedbackType) => {
    onFeedback?.(bookId, feedbackType);
  };

  // Loading skeleton
  if (loading) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            {subtitle && <Skeleton className="h-4 w-64 mt-1" />}
          </div>
          {showViewAll && <Skeleton className="h-9 w-20" />}
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-3 w-3/4 mt-1" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (!recommendations || recommendations.length === 0) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-lg">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center max-w-md">{emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Navigation arrows - visible on larger screens */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View All */}
          {showViewAll && (
            viewAllHref ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={viewAllHref}>View all</Link>
              </Button>
            ) : onViewAll ? (
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                View all
              </Button>
            ) : null
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        )}

        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex-shrink-0 w-40 sm:w-44">
              <RecommendationCard
                recommendation={rec}
                variant="default"
                showReason
                onClick={onItemClick}
                onFeedback={handleFeedback}
              />
            </div>
          ))}
        </div>

        {/* Mobile scroll hint */}
        {recommendations.length > 2 && (
          <div className="sm:hidden flex justify-center mt-2">
            <div className="flex gap-1">
              {Array.from({ length: Math.min(recommendations.length, 5) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    i === 0 ? 'w-4 bg-primary' : 'w-1 bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default RecommendationCarousel;
