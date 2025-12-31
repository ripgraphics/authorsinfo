'use client';

/**
 * RecommendationCard Component
 * Displays a single book recommendation with reason and actions
 * 
 * Features:
 * - 3 display variants (default, compact, detailed)
 * - Shows recommendation reason
 * - Feedback actions (like, dislike, not interested)
 * - Dismiss functionality
 * - Click tracking
 * 
 * @example
 * <RecommendationCard 
 *   recommendation={rec} 
 *   variant="default"
 *   showReason
 *   onFeedback={(bookId, type) => handleFeedback(bookId, type)}
 * />
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  X, 
  MoreHorizontal,
  BookOpen,
  Heart,
  Ban,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  Recommendation, 
  FeedbackType, 
  RecommendationCardProps 
} from '@/types/phase3';

// Re-export types for consumers
export type { Recommendation, FeedbackType, RecommendationCardProps };

// Reason type icons and colors
const reasonTypeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  genre_match: { icon: <BookOpen className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700' },
  author_match: { icon: <Heart className="h-3 w-3" />, color: 'bg-pink-100 text-pink-700' },
  similar_to: { icon: <BookOpen className="h-3 w-3" />, color: 'bg-purple-100 text-purple-700' },
  trending: { icon: <Star className="h-3 w-3" />, color: 'bg-orange-100 text-orange-700' },
  friends_read: { icon: <Heart className="h-3 w-3" />, color: 'bg-green-100 text-green-700' },
  highly_rated: { icon: <Star className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-700' },
  new_release: { icon: <BookOpen className="h-3 w-3" />, color: 'bg-teal-100 text-teal-700' },
  because_you_read: { icon: <BookOpen className="h-3 w-3" />, color: 'bg-indigo-100 text-indigo-700' }
};

export function RecommendationCard({
  recommendation,
  variant = 'default',
  showReason = true,
  showScore = false,
  onDismiss,
  onFeedback,
  onClick,
  className
}: RecommendationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<FeedbackType | null>(null);

  const { book, reason, reasonType, score } = recommendation;
  const reasonConfig = reasonTypeConfig[reasonType] || reasonTypeConfig.genre_match;

  const handleFeedback = (type: FeedbackType) => {
    setFeedbackGiven(type);
    onFeedback?.(book.id, type);
    
    if (type === 'not_interested' || type === 'dislike') {
      // Slight delay before dismissing for visual feedback
      setTimeout(() => {
        onDismiss?.(recommendation.id);
      }, 300);
    }
  };

  const handleClick = () => {
    onClick?.(recommendation);
  };

  const coverUrl = book.cover_image?.url || book.cover_image_url || '/images/book-placeholder.png';

  // Compact variant - smaller card for lists
  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer',
          className
        )}
        onClick={handleClick}
      >
        <div className="relative h-16 w-11 flex-shrink-0">
          <Image
            src={coverUrl}
            alt={book.title}
            fill
            className="object-cover rounded"
            sizes="44px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{book.title}</h4>
          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
          {book.average_rating && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{book.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {onFeedback && (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); handleFeedback('like'); }}
            >
              <ThumbsUp className={cn('h-3.5 w-3.5', feedbackGiven === 'like' && 'fill-green-500 text-green-500')} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); handleFeedback('not_interested'); }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant - larger card with more info
  if (variant === 'detailed') {
    return (
      <Card 
        className={cn(
          'overflow-hidden transition-all duration-200',
          isHovered && 'shadow-lg',
          feedbackGiven && 'opacity-50',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex">
          <Link href={`/books/${book.id}`} onClick={handleClick} className="flex-shrink-0">
            <div className="relative h-48 w-32">
              <Image
                src={coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          </Link>
          <CardContent className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link href={`/books/${book.id}`} onClick={handleClick}>
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
              </div>
              
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={() => onDismiss(recommendation.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              {book.average_rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{book.average_rating.toFixed(1)}</span>
                  {book.review_count && (
                    <span className="text-xs text-muted-foreground">({book.review_count})</span>
                  )}
                </div>
              )}
              {book.genre && (
                <Badge variant="secondary" className="text-xs">{book.genre}</Badge>
              )}
              {book.pages && (
                <span className="text-xs text-muted-foreground">{book.pages} pages</span>
              )}
            </div>

            {showReason && reason && (
              <div className="mt-3">
                <Badge className={cn('text-xs', reasonConfig.color)}>
                  {reasonConfig.icon}
                  <span className="ml-1">{reason}</span>
                </Badge>
              </div>
            )}

            {book.synopsis && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {book.synopsis}
              </p>
            )}

            {showScore && (
              <div className="mt-2 text-xs text-muted-foreground">
                Match score: {(score * 100).toFixed(0)}%
              </div>
            )}

            {onFeedback && (
              <div className="flex items-center gap-2 mt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={feedbackGiven === 'like' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleFeedback('like')}
                        className="gap-1"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Like
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>More recommendations like this</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={feedbackGiven === 'want_more_like_this' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleFeedback('want_more_like_this')}
                        className="gap-1"
                      >
                        <Heart className="h-3.5 w-3.5" />
                        More like this
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show more similar recommendations</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleFeedback('already_read')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Already read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFeedback('not_interested')}>
                      <Ban className="h-4 w-4 mr-2" />
                      Not interested
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleFeedback('dislike')}
                      className="text-destructive"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Don&apos;t recommend this
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    );
  }

  // Default variant - balanced card
  return (
    <Card 
      className={cn(
        'overflow-hidden transition-all duration-200 group',
        isHovered && 'shadow-md',
        feedbackGiven && 'opacity-50',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/books/${book.id}`} onClick={handleClick}>
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={coverUrl}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
          {showScore && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {(score * 100).toFixed(0)}% match
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className="p-3">
        <Link href={`/books/${book.id}`} onClick={handleClick}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-1 truncate">{book.author}</p>
        
        <div className="flex items-center justify-between mt-2">
          {book.average_rating ? (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{book.average_rating.toFixed(1)}</span>
            </div>
          ) : (
            <span />
          )}
          
          {onFeedback && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => { e.preventDefault(); handleFeedback('like'); }}
              >
                <ThumbsUp className={cn('h-3 w-3', feedbackGiven === 'like' && 'fill-green-500 text-green-500')} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => { e.preventDefault(); handleFeedback('not_interested'); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {showReason && reason && (
          <div className="mt-2">
            <Badge variant="secondary" className={cn('text-xs px-2 py-0.5', reasonConfig.color)}>
              {reason.length > 30 ? `${reason.substring(0, 30)}...` : reason}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecommendationCard;
