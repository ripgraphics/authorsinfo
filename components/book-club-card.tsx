'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, Lock, Globe, BookOpen, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface BookClubCreator {
  id: string;
  display_name: string;
  avatar_url?: string;
}

export interface BookClubMemberCount {
  count: number;
}

export interface BookClubData {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_public: boolean;
  max_members?: number;
  created_at?: string;
  book_club_members?: BookClubMemberCount[];
  profiles?: BookClubCreator;
}

export interface BookClubCardProps {
  /** The book club data to display */
  club: BookClubData;
  /** Callback when join button is clicked */
  onJoin?: (id: string) => void;
  /** Callback when leave button is clicked */
  onLeave?: (id: string) => void;
  /** Callback when card is clicked (overrides default link behavior) */
  onClick?: (club: BookClubData) => void;
  /** Whether to show the join/leave button */
  showActionButton?: boolean;
  /** Whether the current user is a member */
  isMember?: boolean;
  /** Whether the join/leave action is loading */
  isLoading?: boolean;
  /** Custom href for the card link (default: /book-clubs/[id]) */
  href?: string;
  /** Whether to disable the link */
  disableLink?: boolean;
  /** Custom className for the card */
  className?: string;
  /** Custom cover height (default: h-32) */
  coverHeight?: string;
  /** Custom placeholder icon when no cover image */
  placeholderIcon?: LucideIcon;
  /** Whether to show the creator info */
  showCreator?: boolean;
  /** Whether to show member count */
  showMemberCount?: boolean;
  /** Whether to show the privacy badge */
  showPrivacyBadge?: boolean;
  /** Custom join button text */
  joinButtonText?: string;
  /** Custom leave button text */
  leaveButtonText?: string;
  /** Custom member badge text */
  memberBadgeText?: string;
  /** Render custom footer content */
  renderFooter?: (club: BookClubData) => ReactNode;
  /** Render custom header content */
  renderHeader?: (club: BookClubData) => ReactNode;
  /** Variant style */
  variant?: 'default' | 'compact' | 'minimal';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getInitials(name?: string, fallback = 'BC'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getMemberCount(club: BookClubData): number {
  return club.book_club_members?.[0]?.count || 0;
}

export function formatMemberCount(count: number, maxMembers?: number): string {
  const memberText = count === 1 ? 'member' : 'members';
  if (maxMembers) {
    return `${count} / ${maxMembers} ${memberText}`;
  }
  return `${count} ${memberText}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BookClubCard({
  club,
  onJoin,
  onLeave,
  onClick,
  showActionButton = true,
  isMember = false,
  isLoading = false,
  href,
  disableLink = false,
  className,
  coverHeight = 'h-32',
  placeholderIcon: PlaceholderIcon = BookOpen,
  showCreator = true,
  showMemberCount = true,
  showPrivacyBadge = true,
  joinButtonText = 'Join',
  leaveButtonText = 'Leave',
  memberBadgeText = 'Member',
  renderFooter,
  renderHeader,
  variant = 'default',
}: BookClubCardProps) {
  const memberCount = getMemberCount(club);
  const creatorInitials = getInitials(club.profiles?.display_name);
  const clubHref = href || `/book-clubs/${club.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(club);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMember) {
      onLeave?.(club.id);
    } else {
      onJoin?.(club.id);
    }
  };

  const CardWrapper = ({ children }: { children: ReactNode }) => {
    if (disableLink) {
      return <div onClick={handleCardClick} className="cursor-pointer">{children}</div>;
    }
    return (
      <Link href={clubHref} onClick={handleCardClick}>
        {children}
      </Link>
    );
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
        <CardWrapper>
          <div className="flex items-center gap-3 p-3">
            <div className={cn('relative w-12 h-12 rounded-md overflow-hidden bg-primary/10 flex-shrink-0')}>
              {club.cover_image_url ? (
                <Image src={club.cover_image_url} alt={club.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PlaceholderIcon className="h-6 w-6 text-primary/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-1">{club.name}</h3>
              {showMemberCount && (
                <p className="text-xs text-muted-foreground">
                  {formatMemberCount(memberCount, club.max_members)}
                </p>
              )}
            </div>
            {showPrivacyBadge && (
              <Badge variant={club.is_public ? 'secondary' : 'outline'} className="text-xs flex-shrink-0">
                {club.is_public ? 'Public' : 'Private'}
              </Badge>
            )}
          </div>
        </CardWrapper>
      </Card>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors', className)}>
        <CardWrapper>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded overflow-hidden bg-primary/10">
              {club.cover_image_url ? (
                <Image src={club.cover_image_url} alt={club.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PlaceholderIcon className="h-4 w-4 text-primary/30" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium line-clamp-1">{club.name}</span>
          </div>
        </CardWrapper>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow duration-200', className)}>
      <CardWrapper>
        <div className={cn('relative bg-gradient-to-br from-primary/20 to-primary/5', coverHeight)}>
          {club.cover_image_url ? (
            <Image src={club.cover_image_url} alt={club.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <PlaceholderIcon className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {showPrivacyBadge && (
            <div className="absolute top-2 right-2">
              <Badge variant={club.is_public ? 'secondary' : 'outline'} className="gap-1">
                {club.is_public ? (
                  <>
                    <Globe className="h-3 w-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    Private
                  </>
                )}
              </Badge>
            </div>
          )}
        </div>
      </CardWrapper>

      <CardHeader className="pb-2">
        {renderHeader ? (
          renderHeader(club)
        ) : (
          <>
            <CardWrapper>
              <h3 className="font-semibold text-lg line-clamp-1 hover:underline">{club.name}</h3>
            </CardWrapper>
            {club.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
            )}
          </>
        )}
      </CardHeader>

      {showMemberCount && (
        <CardContent className="pb-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{formatMemberCount(memberCount, club.max_members)}</span>
            </div>
          </div>
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between pt-2 border-t">
        {renderFooter ? (
          renderFooter(club)
        ) : (
          <>
            {showCreator && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={club.profiles?.avatar_url} />
                  <AvatarFallback>{creatorInitials}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  by {club.profiles?.display_name || 'Unknown'}
                </span>
              </div>
            )}

            {showActionButton && isMember && (
              <Badge variant="secondary" className="text-xs">
                {memberBadgeText}
              </Badge>
            )}

            {showActionButton && !isMember && club.is_public && onJoin && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleActionClick}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : joinButtonText}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
