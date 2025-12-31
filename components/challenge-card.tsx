'use client';

/**
 * ChallengeCard Component - Fully Reusable
 * Displays a summary of a reading challenge with configurable variants and callbacks
 * 
 * @example Basic usage
 * <ChallengeCard challenge={challengeData} />
 * 
 * @example With callbacks
 * <ChallengeCard 
 *   challenge={challengeData} 
 *   onViewDetails={(id) => router.push(`/challenges/${id}`)}
 *   showUser={true}
 * />
 * 
 * @example Compact variant
 * <ChallengeCard challenge={challengeData} variant="compact" />
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Trophy, ChevronRight, User, Clock, Target, Flame } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES - All exported for reusability
// ============================================================================

/** Challenge status type */
export type ChallengeStatus = 'active' | 'completed' | 'abandoned' | 'paused';

/** Goal type for reading challenges */
export type GoalType = 'books' | 'pages' | 'minutes' | 'authors';

/** User information attached to a challenge */
export interface ChallengeUser {
  id?: string;
  full_name?: string;
  avatar_url?: string;
  username?: string;
}

/** Core challenge data structure */
export interface ChallengeData {
  id: string;
  title: string;
  description?: string | null;
  goalType: GoalType;
  goalValue: number;
  currentValue: number;
  startDate: string | Date;
  endDate: string | Date;
  challengeYear: number;
  status: ChallengeStatus;
  isPublic?: boolean;
  user?: ChallengeUser | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Card display variants */
export type ChallengeCardVariant = 'default' | 'compact' | 'minimal' | 'featured';

/** Props for ChallengeCard component */
export interface ChallengeCardProps {
  /** Challenge data to display */
  challenge: ChallengeData;
  /** Visual variant of the card */
  variant?: ChallengeCardVariant;
  /** Show user avatar and name */
  showUser?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
  /** Show end date */
  showEndDate?: boolean;
  /** Show trophy icon for completed challenges */
  showCompletedIcon?: boolean;
  /** Show description text */
  showDescription?: boolean;
  /** Custom link for details button (if not provided, uses default) */
  detailsHref?: string;
  /** Callback when view details is clicked */
  onViewDetails?: (challengeId: string) => void;
  /** Callback when card is clicked */
  onClick?: (challenge: ChallengeData) => void;
  /** Custom action button text */
  actionText?: string;
  /** Hide the footer action button */
  hideAction?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom date formatter */
  formatDate?: (date: Date | string) => string;
  /** Custom progress formatter */
  formatProgress?: (current: number, goal: number, type: GoalType) => string;
}

// ============================================================================
// UTILITIES - All exported for external use
// ============================================================================

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

/**
 * Get human-readable label for goal type
 */
export function getGoalLabel(type: GoalType): string {
  const labels: Record<GoalType, string> = {
    books: 'books',
    pages: 'pages',
    minutes: 'minutes',
    authors: 'authors',
  };
  return labels[type] || 'units';
}

/**
 * Get icon component for goal type
 */
export function getGoalIcon(type: GoalType): React.ElementType {
  const icons: Record<GoalType, React.ElementType> = {
    books: BookOpen,
    pages: Target,
    minutes: Clock,
    authors: User,
  };
  return icons[type] || BookOpen;
}

/**
 * Format date for display
 */
export function formatChallengeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

/**
 * Get status badge variant
 */
export function getStatusVariant(status: ChallengeStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<ChallengeStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    active: 'secondary',
    paused: 'outline',
    abandoned: 'destructive',
  };
  return variants[status] || 'secondary';
}

/**
 * Get days remaining until challenge end
 */
export function getDaysRemaining(endDate: Date | string): number {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if challenge is on track based on progress and time elapsed
 */
export function isOnTrack(challenge: ChallengeData): boolean {
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);
  const now = new Date();
  
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (elapsedDays / totalDays) * challenge.goalValue;
  
  return challenge.currentValue >= expectedProgress * 0.9; // Within 10% of expected
}

/**
 * Get user initials from name
 */
export function getUserInitials(name?: string): string {
  if (!name) return '?';
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

export function ChallengeCard({
  challenge,
  variant = 'default',
  showUser = true,
  showProgress = true,
  showEndDate = true,
  showCompletedIcon = true,
  showDescription = false,
  detailsHref,
  onViewDetails,
  onClick,
  actionText = 'View Details',
  hideAction = false,
  className,
  formatDate = formatChallengeDate,
  formatProgress,
}: ChallengeCardProps) {
  const progress = calculateProgress(challenge.currentValue, challenge.goalValue);
  const isCompleted = challenge.status === 'completed';
  const daysRemaining = getDaysRemaining(challenge.endDate);
  const onTrack = isOnTrack(challenge);
  const GoalIcon = getGoalIcon(challenge.goalType);

  const handleClick = () => {
    if (onClick) {
      onClick(challenge);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    if (onViewDetails) {
      e.preventDefault();
      onViewDetails(challenge.id);
    }
  };

  const progressText = formatProgress 
    ? formatProgress(challenge.currentValue, challenge.goalValue, challenge.goalType)
    : `${challenge.currentValue} / ${challenge.goalValue} ${getGoalLabel(challenge.goalType)}`;

  const href = detailsHref || `/reading-challenge/${challenge.id}`;

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <GoalIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{challenge.title}</p>
            <p className="text-xs text-muted-foreground">{progressText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{progress}%</span>
          {isCompleted && showCompletedIcon && <Trophy className="h-4 w-4 text-yellow-500" />}
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={cn("overflow-hidden", className)} onClick={handleClick}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-semibold line-clamp-1">{challenge.title}</p>
              <p className="text-xs text-muted-foreground">{progressText}</p>
            </div>
            {isCompleted && showCompletedIcon && <Trophy className="h-5 w-5 text-yellow-500" />}
          </div>
          {showProgress && <Progress value={progress} className="h-1.5" />}
        </CardContent>
      </Card>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <Card className={cn("overflow-hidden border-2 border-primary/20 bg-primary/5", className)} onClick={handleClick}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="bg-primary">
              <Flame className="h-3 w-3 mr-1" />
              Featured
            </Badge>
            {isCompleted && showCompletedIcon && <Trophy className="h-6 w-6 text-yellow-500" />}
          </div>
          <CardTitle className="text-2xl">{challenge.title}</CardTitle>
          {showDescription && challenge.description && (
            <p className="text-muted-foreground line-clamp-2">{challenge.description}</p>
          )}
          {showUser && challenge.user && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={challenge.user.avatar_url} />
                <AvatarFallback>{getUserInitials(challenge.user.full_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{challenge.user.full_name}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GoalIcon className="h-5 w-5" />
              <span className="font-medium">{progressText}</span>
            </div>
            <span className="text-2xl font-bold text-primary">{progress}%</span>
          </div>
          {showProgress && <Progress value={progress} className="h-3" />}
          <div className="flex items-center justify-between text-sm">
            {showEndDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{daysRemaining} days left</span>
              </div>
            )}
            {onTrack ? (
              <Badge variant="outline" className="text-green-600 border-green-600">On Track</Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">Behind</Badge>
            )}
          </div>
        </CardContent>
        {!hideAction && (
          <CardFooter className="bg-primary/10 pt-4">
            <Button asChild className="w-full" onClick={handleViewDetails}>
              <Link href={href}>
                {actionText}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)} onClick={handleClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={getStatusVariant(challenge.status)} className="mb-2">
            {challenge.challengeYear} Challenge
          </Badge>
          {isCompleted && showCompletedIcon && <Trophy className="h-5 w-5 text-yellow-500" />}
        </div>
        <CardTitle className="text-xl line-clamp-1">{challenge.title}</CardTitle>
        {showDescription && challenge.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{challenge.description}</p>
        )}
        {showUser && challenge.user && (
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={challenge.user.avatar_url} />
              <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{challenge.user.full_name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GoalIcon className="h-4 w-4" />
            <span>{progressText}</span>
          </div>
          <span className="font-bold">{progress}%</span>
        </div>
        
        {showProgress && <Progress value={progress} className="h-2" />}
        
        {showEndDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Ends {formatDate(challenge.endDate)}</span>
          </div>
        )}
      </CardContent>
      {!hideAction && (
        <CardFooter className="bg-muted/50 pt-4">
          <Button asChild variant="ghost" className="w-full justify-between group" onClick={handleViewDetails}>
            <Link href={href}>
              {actionText}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
