'use client';

/**
 * ShelfCard Component
 * Displays a single shelf with its metadata and book count
 */

import React from 'react';
import { CustomShelf } from '@/types/phase3';
import { cn } from '@/lib/utils';
import { MoreVertical, Trash2, Settings, Globe, Lock, Share2, Eye, Calendar, Loader2, BookOpen, UserPlus, UserCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ShelfCardProps {
  shelf: CustomShelf & { bookCount?: number };
  onSelect: (shelf: CustomShelf) => void;
  onSettings: (shelf: CustomShelf) => void;
  onDelete: (shelf: CustomShelf) => void;
  isSelected?: boolean;
  className?: string;
  isOwnEntity?: boolean;
  showQuickActions?: boolean;
  isSelectable?: boolean;
  isSelectedForBulk?: boolean;
  onBulkSelect?: (selected: boolean) => void;
}

export function ShelfCard({
  shelf,
  onSelect,
  onSettings,
  onDelete,
  isSelected = false,
  className,
  isOwnEntity = false,
  showQuickActions = true,
  isSelectable = false,
  isSelectedForBulk = false,
  onBulkSelect,
}: ShelfCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [booksInCommon, setBooksInCommon] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (!isOwnEntity && shelf.isPublic && user) {
      // Fetch books in common
      fetchBooksInCommon();
      // Check follow status
      checkFollowStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelf.id, user?.id, isOwnEntity, shelf.isPublic]);

  const checkFollowStatus = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/follow?entityId=${shelf.id}&targetType=custom_shelf`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing || false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to follow shelves',
        variant: 'destructive',
      });
      return;
    }

    setIsFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch('/api/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: shelf.id,
          targetType: 'custom_shelf',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      setIsFollowing(!isFollowing);
      toast({
        title: isFollowing ? 'Unfollowed shelf' : 'Following shelf',
        description: `You ${isFollowing ? "aren't" : 'are'} following "${shelf.name}"`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const fetchBooksInCommon = async () => {
    try {
      const response = await fetch(`/api/shelves/${shelf.id}/books-in-common`);
      if (response.ok) {
        const data = await response.json();
        setBooksInCommon(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching books in common:', error);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/shelves/${shelf.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied',
      description: 'Shelf link has been copied to clipboard',
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger select if clicking on the dropdown button or menu
    const target = e.target as HTMLElement;
    // Check if click originated from a button (dropdown trigger) or menu
    if (
      target.closest('button') ||
      target.closest('[role="menu"]') ||
      target.closest('[data-radix-dropdown-menu-content]')
    ) {
      return;
    }
    onSelect(shelf);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative w-full p-4 rounded-lg border-2 transition-all cursor-pointer',
        'hover:border-primary/50 hover:bg-accent',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {isSelectable && (
          <Checkbox
            checked={isSelectedForBulk}
            onCheckedChange={(checked) => {
              if (onBulkSelect) {
                onBulkSelect(checked === true)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
        )}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {shelf.icon && <span className="text-lg">{shelf.icon}</span>}
            <h3 className="font-semibold text-sm truncate">{shelf.name}</h3>
            {shelf.isDefault && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
            {shelf.isPublic ? (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Private
              </Badge>
            )}
          </div>

          {shelf.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {shelf.description}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                {shelf.bookCount || 0} {shelf.bookCount === 1 ? 'book' : 'books'}
              </span>
            </div>
            {shelf.updatedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(shelf.updatedAt), { addSuffix: true })}
                </span>
              </div>
            )}
            {shelf.color && (
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: shelf.color }}
                title={`Color: ${shelf.color}`}
              />
            )}
          </div>

          {showQuickActions && !isOwnEntity && shelf.isPublic && (
            <div className="space-y-2 mt-2 pt-2 border-t">
              {user && booksInCommon !== null && booksInCommon > 0 && (
                <div className="text-xs text-muted-foreground">
                  You have {booksInCommon} {booksInCommon === 1 ? 'book' : 'books'} in common
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(shelf);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleShare}
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
                {/* Only show Follow button if user is logged in */}
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                  >
                    {isFollowLoading ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {isOwnEntity && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(shelf);
                }}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings(shelf);
                }}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              {shelf.isPublic && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(`${window.location.origin}/shelves/${shelf.id}`);
                  }}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </DropdownMenuItem>
              )}
              {!shelf.isDefault && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(shelf);
                  }}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
