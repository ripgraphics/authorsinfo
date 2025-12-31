'use client';

import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { MessageSquare, Pin, BookOpen, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface DiscussionAuthor {
  id: string;
  display_name: string;
  avatar_url?: string;
}

export interface DiscussionBook {
  id: string;
  title: string;
  cover_image_url?: string;
}

export interface DiscussionCommentCount {
  count: number;
}

export interface DiscussionData {
  id: string;
  title: string;
  content: string;
  is_pinned?: boolean;
  created_at: string;
  updated_at?: string;
  permalink?: string;
  profiles?: DiscussionAuthor;
  books?: DiscussionBook;
  comments?: DiscussionCommentCount[];
  category_id?: number;
  group_id?: string;
}

export interface DiscussionCardProps {
  /** The discussion data to display */
  discussion: DiscussionData;
  /** Whether to show the associated book */
  showBook?: boolean;
  /** Whether to show the author info */
  showAuthor?: boolean;
  /** Whether to show the comment count */
  showCommentCount?: boolean;
  /** Whether to show the pinned indicator */
  showPinnedIndicator?: boolean;
  /** Whether to show the content preview */
  showContentPreview?: boolean;
  /** Maximum characters for content preview */
  contentPreviewLength?: number;
  /** Callback when card is clicked (overrides default link behavior) */
  onClick?: (discussion: DiscussionData) => void;
  /** Callback when more options button is clicked */
  onMoreClick?: (discussion: DiscussionData) => void;
  /** Custom href for the discussion link */
  href?: string;
  /** Whether to disable the link */
  disableLink?: boolean;
  /** Custom className for the card */
  className?: string;
  /** Date format type */
  dateFormat?: 'relative' | 'absolute' | 'both';
  /** Custom date format string (for absolute) */
  dateFormatString?: string;
  /** Custom icon for book link */
  bookIcon?: LucideIcon;
  /** Custom icon for comments */
  commentIcon?: LucideIcon;
  /** Custom icon for pinned */
  pinnedIcon?: LucideIcon;
  /** Whether to show more options button */
  showMoreOptions?: boolean;
  /** Render custom footer content */
  renderFooter?: (discussion: DiscussionData) => ReactNode;
  /** Render custom header content */
  renderHeader?: (discussion: DiscussionData) => ReactNode;
  /** Render custom badge/tags */
  renderBadges?: (discussion: DiscussionData) => ReactNode;
  /** Reply count label singular */
  replyLabelSingular?: string;
  /** Reply count label plural */
  replyLabelPlural?: string;
  /** Variant style */
  variant?: 'default' | 'compact' | 'minimal';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getDiscussionInitials(name?: string, fallback = 'U'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCommentCount(discussion: DiscussionData): number {
  return discussion.comments?.[0]?.count || 0;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function truncateContent(content: string, maxLength: number): string {
  const stripped = stripHtml(content);
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength) + '...';
}

export function formatDiscussionDate(
  date: string,
  formatType: 'relative' | 'absolute' | 'both' = 'relative',
  formatString = 'MMM d, yyyy'
): string {
  const dateObj = new Date(date);
  if (formatType === 'relative') {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  }
  if (formatType === 'absolute') {
    return format(dateObj, formatString);
  }
  return `${format(dateObj, formatString)} (${formatDistanceToNow(dateObj, { addSuffix: true })})`;
}

export function getDiscussionUrl(discussion: DiscussionData, baseUrl = '/discussions'): string {
  return discussion.permalink
    ? `${baseUrl}/${discussion.permalink}`
    : `${baseUrl}/${discussion.id}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DiscussionCard({
  discussion,
  showBook = true,
  showAuthor = true,
  showCommentCount = true,
  showPinnedIndicator = true,
  showContentPreview = true,
  contentPreviewLength = 150,
  onClick,
  onMoreClick,
  href,
  disableLink = false,
  className,
  dateFormat = 'relative',
  dateFormatString = 'MMM d, yyyy',
  bookIcon: BookIcon = BookOpen,
  commentIcon: CommentIcon = MessageSquare,
  pinnedIcon: PinnedIcon = Pin,
  showMoreOptions = false,
  renderFooter,
  renderHeader,
  renderBadges,
  replyLabelSingular = 'reply',
  replyLabelPlural = 'replies',
  variant = 'default',
}: DiscussionCardProps) {
  const commentCount = getCommentCount(discussion);
  const authorInitials = getDiscussionInitials(discussion.profiles?.display_name);
  const discussionUrl = href || getDiscussionUrl(discussion);
  const isPinned = discussion.is_pinned && showPinnedIndicator;

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(discussion);
    }
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMoreClick?.(discussion);
  };

  const CardLink = ({ children, className: linkClassName }: { children: ReactNode; className?: string }) => {
    if (disableLink) {
      return <div onClick={handleCardClick} className={cn('cursor-pointer', linkClassName)}>{children}</div>;
    }
    return (
      <Link href={discussionUrl} onClick={handleCardClick} className={linkClassName}>
        {children}
      </Link>
    );
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors',
        isPinned && 'border-primary/50 bg-primary/5',
        className
      )}>
        {isPinned && <PinnedIcon className="h-4 w-4 text-primary flex-shrink-0" />}
        <CardLink className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-1 hover:underline">{discussion.title}</h3>
        </CardLink>
        {showCommentCount && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs flex-shrink-0">
            <CommentIcon className="h-3 w-3" />
            <span>{commentCount}</span>
          </div>
        )}
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <CardLink className={cn('block p-2 rounded hover:bg-muted/50 transition-colors', className)}>
        <div className="flex items-center gap-2">
          {isPinned && <PinnedIcon className="h-3 w-3 text-primary" />}
          <span className="text-sm line-clamp-1">{discussion.title}</span>
        </div>
      </CardLink>
    );
  }

  // Default variant
  return (
    <Card className={cn(
      'hover:shadow-md transition-shadow duration-200',
      isPinned && 'border-primary/50 bg-primary/5',
      className
    )}>
      <CardHeader className="pb-2">
        {renderHeader ? (
          renderHeader(discussion)
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isPinned && (
                  <PinnedIcon className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <CardLink className="hover:underline flex-1 min-w-0">
                  <h3 className="font-semibold text-base line-clamp-2">{discussion.title}</h3>
                </CardLink>
              </div>
              {showContentPreview && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {truncateContent(discussion.content, contentPreviewLength)}
                </p>
              )}
              {renderBadges && (
                <div className="flex items-center gap-2 mt-2">
                  {renderBadges(discussion)}
                </div>
              )}
            </div>
            {showMoreOptions && onMoreClick && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleMoreClick}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      {showBook && discussion.books && (
        <CardContent className="pb-2 pt-0">
          <Link
            href={`/books/${discussion.books.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookIcon className="h-4 w-4" />
            <span className="line-clamp-1">{discussion.books.title}</span>
          </Link>
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between pt-2 border-t text-sm">
        {renderFooter ? (
          renderFooter(discussion)
        ) : (
          <>
            {showAuthor && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={discussion.profiles?.avatar_url} />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">
                    {discussion.profiles?.display_name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDiscussionDate(discussion.created_at, dateFormat, dateFormatString)}
                  </span>
                </div>
              </div>
            )}

            {showCommentCount && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <CommentIcon className="h-4 w-4" />
                <span className="text-xs">
                  {commentCount} {commentCount === 1 ? replyLabelSingular : replyLabelPlural}
                </span>
              </div>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
