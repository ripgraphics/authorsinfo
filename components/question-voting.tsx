'use client';

import { useState } from 'react';
import { ChevronUp, MessageSquare, CheckCircle2, Star, type LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { QAQuestion, QuestionStatus } from '@/types/phase3';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface QuestionVotingProps {
  /** The question data to display */
  question: QAQuestion;
  /** Callback when vote button is clicked */
  onVote: (questionId: string) => void | Promise<void>;
  /** Callback when question is clicked */
  onClick?: (question: QAQuestion) => void;
  /** Whether voting is in progress */
  isVoting?: boolean;
  /** Custom className */
  className?: string;
  /** Whether to show answers */
  showAnswers?: boolean;
  /** Whether to show vote button */
  showVoteButton?: boolean;
  /** Whether to show status badge */
  showStatus?: boolean;
  /** Whether the question is expanded */
  isExpanded?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggleExpand?: (questionId: string) => void;
  /** Variant style */
  variant?: 'default' | 'compact' | 'detailed';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getStatusColor(status: QuestionStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    case 'approved':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'answered':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-700 border-red-500/20';
    case 'featured':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
}

export function getStatusLabel(status: QuestionStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'answered':
      return 'Answered';
    case 'rejected':
      return 'Rejected';
    case 'featured':
      return '⭐ Featured';
    default:
      return status;
  }
}

export function getStatusIcon(status: QuestionStatus): LucideIcon {
  switch (status) {
    case 'answered':
      return CheckCircle2;
    case 'featured':
      return Star;
    default:
      return MessageSquare;
  }
}

export function getInitials(name?: string, fallback = 'U'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatQuestionDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuestionVoting({
  question,
  onVote,
  onClick,
  isVoting = false,
  className,
  showAnswers = true,
  showVoteButton = true,
  showStatus = true,
  isExpanded = false,
  onToggleExpand,
  variant = 'default',
}: QuestionVotingProps) {
  const StatusIcon = getStatusIcon(question.status);
  const hasAnswers = question.answers && question.answers.length > 0;
  const officialAnswers = question.answers?.filter(a => a.isOfficial) || [];

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(question.id);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(question);
    } else if (onToggleExpand) {
      onToggleExpand(question.id);
    }
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Vote button */}
        {showVoteButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVoteClick}
            disabled={isVoting}
            className={cn(
              'flex flex-col items-center gap-0.5 h-auto py-1 px-2',
              question.hasUpvoted && 'text-primary'
            )}
          >
            <ChevronUp className={cn('h-4 w-4', question.hasUpvoted && 'fill-primary')} />
            <span className="text-xs font-semibold">{question.upvotes}</span>
          </Button>
        )}

        {/* Question text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-1">{question.questionText}</p>
          {!question.isAnonymous && question.user && (
            <p className="text-xs text-muted-foreground">by {question.user.full_name}</p>
          )}
        </div>

        {/* Status badge */}
        {showStatus && (
          <Badge variant="outline" className={cn('text-xs flex-shrink-0', getStatusColor(question.status))}>
            {getStatusLabel(question.status)}
          </Badge>
        )}
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            {/* Vote section */}
            {showVoteButton && (
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoteClick}
                  disabled={isVoting}
                  className={cn(
                    'h-8 w-8 p-0',
                    question.hasUpvoted && 'text-primary hover:text-primary'
                  )}
                >
                  <ChevronUp className={cn('h-5 w-5', question.hasUpvoted && 'fill-primary')} />
                </Button>
                <span className="text-sm font-semibold">{question.upvotes}</span>
                <span className="text-xs text-muted-foreground">votes</span>
              </div>
            )}

            {/* Question content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-medium flex-1">{question.questionText}</p>
                {showStatus && (
                  <Badge variant="outline" className={cn('flex-shrink-0', getStatusColor(question.status))}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {getStatusLabel(question.status)}
                  </Badge>
                )}
              </div>

              {/* User info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {!question.isAnonymous && question.user ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={question.user.avatar_url} alt={question.user.full_name} />
                      <AvatarFallback>{getInitials(question.user.full_name)}</AvatarFallback>
                    </Avatar>
                    <span>{question.user.full_name}</span>
                  </>
                ) : (
                  <span className="italic">Anonymous</span>
                )}
                <span>•</span>
                <span>{formatRelativeTime(question.createdAt)}</span>
              </div>

              {/* Answers */}
              {showAnswers && hasAnswers && (
                <div className="mt-3 space-y-2 pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {officialAnswers.length > 0 ? 'Official Answer' : `${question.answers!.length} Answer${question.answers!.length > 1 ? 's' : ''}`}
                  </p>
                  {(officialAnswers.length > 0 ? officialAnswers : question.answers!.slice(0, 1)).map((answer) => (
                    <div key={answer.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <p className="text-sm">{answer.answerText}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {answer.responder && (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={answer.responder.avatar_url} alt={answer.responder.full_name} />
                              <AvatarFallback>{getInitials(answer.responder.full_name)}</AvatarFallback>
                            </Avatar>
                            <span>{answer.responder.full_name}</span>
                          </>
                        )}
                        {answer.isOfficial && (
                          <Badge variant="secondary" className="text-xs">Official</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {question.isFeatured && (
          <CardFooter className="bg-purple-500/10 border-t border-purple-500/20 py-2 px-4">
            <div className="flex items-center gap-2 text-xs text-purple-700">
              <Star className="h-3 w-3 fill-purple-700" />
              <span className="font-medium">Featured Question</span>
            </div>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      className={cn('overflow-hidden hover:shadow-md transition-shadow cursor-pointer', className)}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Vote section */}
          {showVoteButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoteClick}
              disabled={isVoting}
              className={cn(
                'flex flex-col items-center gap-0.5 h-auto py-2 px-2',
                question.hasUpvoted && 'text-primary'
              )}
            >
              <ChevronUp className={cn('h-5 w-5', question.hasUpvoted && 'fill-primary')} />
              <span className="text-sm font-semibold">{question.upvotes}</span>
            </Button>
          )}

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium flex-1">{question.questionText}</p>
              {showStatus && (
                <Badge variant="outline" className={cn('text-xs flex-shrink-0', getStatusColor(question.status))}>
                  {getStatusLabel(question.status)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {!question.isAnonymous && question.user ? (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={question.user.avatar_url} alt={question.user.full_name} />
                    <AvatarFallback>{getInitials(question.user.full_name)}</AvatarFallback>
                  </Avatar>
                  <span>{question.user.full_name}</span>
                </>
              ) : (
                <span className="italic">Anonymous</span>
              )}
              <span>•</span>
              <span>{formatRelativeTime(question.createdAt)}</span>
              {hasAnswers && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{question.answers!.length} answer{question.answers!.length > 1 ? 's' : ''}</span>
                  </div>
                </>
              )}
            </div>

            {question.isFeatured && (
              <div className="flex items-center gap-1 text-xs text-purple-700 mt-1">
                <Star className="h-3 w-3 fill-purple-700" />
                <span className="font-medium">Featured</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
