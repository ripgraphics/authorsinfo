'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  User,
  Book,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import type {
  QASession,
  QASessionStatus,
  QASessionType,
} from '@/types/phase3';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface QASessionCardProps {
  /** The Q&A session data to display */
  session: QASession;
  /** Callback when card is clicked */
  onClick?: (session: QASession) => void;
  /** Callback when join button is clicked */
  onJoin?: (id: string) => void;
  /** Callback when submit question button is clicked */
  onSubmitQuestion?: (id: string) => void;
  /** Whether to show the action button */
  showActionButton?: boolean;
  /** Whether the current user has RSVP'd */
  hasRSVPd?: boolean;
  /** Whether the action is loading */
  isLoading?: boolean;
  /** Custom href for the card link (default: /qa-sessions/[id]) */
  href?: string;
  /** Whether to disable the link */
  disableLink?: boolean;
  /** Custom className for the card */
  className?: string;
  /** Whether to show question count */
  showQuestionCount?: boolean;
  /** Whether to show author info */
  showAuthor?: boolean;
  /** Whether to show host info */
  showHost?: boolean;
  /** Whether to show book info */
  showBook?: boolean;
  /** Custom join button text */
  joinButtonText?: string;
  /** Custom submit question button text */
  submitQuestionButtonText?: string;
  /** Render custom footer content */
  renderFooter?: (session: QASession) => ReactNode;
  /** Render custom header content */
  renderHeader?: (session: QASession) => ReactNode;
  /** Variant style */
  variant?: 'default' | 'compact' | 'detailed';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getSessionStatusColor(status: QASessionStatus): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'accepting_questions':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'live':
      return 'bg-red-500/10 text-red-700 border-red-500/20 animate-pulse';
    case 'completed':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    case 'cancelled':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
}

export function getSessionStatusLabel(status: QASessionStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'accepting_questions':
      return 'Accepting Questions';
    case 'live':
      return '🔴 LIVE';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getSessionTypeIcon(type: QASessionType): LucideIcon {
  switch (type) {
    case 'ama':
      return MessageSquare;
    case 'book_launch':
      return Book;
    case 'interview':
      return Users;
    case 'live_reading':
      return Book;
    default:
      return MessageSquare;
  }
}

export function getSessionTypeLabel(type: QASessionType): string {
  switch (type) {
    case 'ama':
      return 'Ask Me Anything';
    case 'book_launch':
      return 'Book Launch';
    case 'interview':
      return 'Interview';
    case 'live_reading':
      return 'Live Reading';
    default:
      return type;
  }
}

export function formatSessionDate(date: Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatSessionTime(date: Date): string {
  return format(new Date(date), 'h:mm a');
}

export function getInitials(name?: string, fallback = 'QA'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QASessionCard({
  session,
  onClick,
  onJoin,
  onSubmitQuestion,
  showActionButton = true,
  hasRSVPd = false,
  isLoading = false,
  href,
  disableLink = false,
  className,
  showQuestionCount = true,
  showAuthor = true,
  showHost = false,
  showBook = true,
  joinButtonText = 'Join Session',
  submitQuestionButtonText = 'Submit Question',
  renderFooter,
  renderHeader,
  variant = 'default',
}: QASessionCardProps) {
  const sessionHref = href || `/qa-sessions/${session.id}`;
  const TypeIcon = getSessionTypeIcon(session.sessionType);

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(session);
    }
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onJoin?.(session.id);
  };

  const handleQuestionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmitQuestion?.(session.id);
  };

  const CardWrapper = ({ children }: { children: ReactNode }) => {
    if (disableLink) {
      return <div onClick={handleCardClick} className="cursor-pointer">{children}</div>;
    }
    return (
      <Link href={sessionHref} onClick={handleCardClick}>
        {children}
      </Link>
    );
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
        <CardWrapper>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base line-clamp-1">{session.title}</h3>
                {showAuthor && session.author && (
                  <p className="text-sm text-muted-foreground">with {session.author.name}</p>
                )}
              </div>
              <Badge variant="outline" className={cn('text-xs flex-shrink-0', getSessionStatusColor(session.status))}>
                {getSessionStatusLabel(session.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatSessionDate(session.scheduledStart)}</span>
              </div>
              {showQuestionCount && session.questionCount !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{session.questionCount} questions</span>
                </div>
              )}
            </div>
          </div>
        </CardWrapper>
      </Card>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', className)}>
        {renderHeader ? renderHeader(session) : null}
        <CardWrapper>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TypeIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className={cn('text-xs mb-1', getSessionStatusColor(session.status))}>
                    {getSessionStatusLabel(session.status)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{getSessionTypeLabel(session.sessionType)}</p>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold line-clamp-2">{session.title}</h3>
            {session.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{session.description}</p>
            )}
          </CardHeader>

          <CardContent className="pb-3 space-y-3">
            {/* Author Info */}
            {showAuthor && session.author && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.author.photo_url} alt={session.author.name} />
                  <AvatarFallback>{getInitials(session.author.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{session.author.name}</p>
                  <p className="text-xs text-muted-foreground">Author</p>
                </div>
              </div>
            )}

            {/* Book Info */}
            {showBook && session.book && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Book className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium line-clamp-1">{session.book.title}</p>
                  <p className="text-xs text-muted-foreground">Featured Book</p>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatSessionDate(session.scheduledStart)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatSessionTime(session.scheduledStart)}</span>
              </div>
            </div>

            {/* Stats */}
            {showQuestionCount && session.questionCount !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{session.questionCount}</span>
                <span className="text-muted-foreground">questions submitted</span>
              </div>
            )}
          </CardContent>
        </CardWrapper>

        {(showActionButton || renderFooter) && (
          <CardFooter className="flex items-center justify-between gap-2 pt-3">
            {renderFooter ? (
              renderFooter(session)
            ) : showActionButton ? (
              <>
                {hasRSVPd || session.status === 'live' || session.status === 'accepting_questions' ? (
                  <Button
                    variant="default"
                    onClick={handleQuestionClick}
                    disabled={isLoading || session.status === 'completed' || session.status === 'cancelled'}
                    className="flex-1"
                  >
                    {isLoading ? 'Loading...' : submitQuestionButtonText}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleJoinClick}
                    disabled={isLoading || session.status === 'completed' || session.status === 'cancelled'}
                    className="flex-1"
                  >
                    {isLoading ? 'Loading...' : joinButtonText}
                  </Button>
                )}
              </>
            ) : null}
          </CardFooter>
        )}
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
      {renderHeader ? renderHeader(session) : null}
      <CardWrapper>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold line-clamp-2 flex-1">{session.title}</h3>
            <Badge variant="outline" className={cn('text-xs flex-shrink-0', getSessionStatusColor(session.status))}>
              {getSessionStatusLabel(session.status)}
            </Badge>
          </div>
          {session.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
          )}
        </CardHeader>

        <CardContent className="pb-3 space-y-2">
          {showAuthor && session.author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={session.author.photo_url} alt={session.author.name} />
                <AvatarFallback>{getInitials(session.author.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{session.author.name}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatSessionDate(session.scheduledStart)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatSessionTime(session.scheduledStart)}</span>
            </div>
            {showQuestionCount && session.questionCount !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{session.questionCount} questions</span>
              </div>
            )}
          </div>
        </CardContent>
      </CardWrapper>

      {(showActionButton || renderFooter) && (
        <CardFooter className="pt-3">
          {renderFooter ? (
            renderFooter(session)
          ) : showActionButton ? (
            <Button
              variant={hasRSVPd ? 'default' : 'outline'}
              onClick={hasRSVPd ? handleQuestionClick : handleJoinClick}
              disabled={isLoading || session.status === 'completed' || session.status === 'cancelled'}
              className="w-full"
              size="sm"
            >
              {isLoading ? 'Loading...' : hasRSVPd ? submitQuestionButtonText : joinButtonText}
            </Button>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
}
