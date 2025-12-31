'use client';

/**
 * ProfileBadgeShowcase Component
 * Displays featured badges on a user profile
 */

import React from 'react';
import { UserBadge, Badge } from '@/types/phase3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Award, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProfileBadgeShowcaseProps {
  userBadges: UserBadge[];
  featuredBadges?: UserBadge[];
  totalBadgeCount?: number;
  totalPoints?: number;
  showAllLink?: boolean;
  compact?: boolean;
}

const tierColors: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-800 ring-amber-500/30',
  silver: 'from-gray-300 to-gray-500 ring-gray-400/30',
  gold: 'from-yellow-400 to-yellow-600 ring-yellow-500/30',
  platinum: 'from-cyan-300 to-cyan-500 ring-cyan-400/30',
  diamond: 'from-purple-400 to-pink-500 ring-purple-500/30',
};

export function ProfileBadgeShowcase({
  userBadges,
  featuredBadges,
  totalBadgeCount,
  totalPoints = 0,
  showAllLink = true,
  compact = false,
}: ProfileBadgeShowcaseProps) {
  // Use featured badges if provided, otherwise take top 5 by tier
  const displayBadges = featuredBadges?.slice(0, 5) || 
    userBadges
      .filter(ub => ub.badge)
      .sort((a, b) => {
        const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
        const aTier = a.badge?.tier || 'bronze';
        const bTier = b.badge?.tier || 'bronze';
        return (tierOrder[bTier as keyof typeof tierOrder] || 0) - 
               (tierOrder[aTier as keyof typeof tierOrder] || 0);
      })
      .slice(0, 5);

  if (userBadges.length === 0) {
    return compact ? null : (
      <Card>
        <CardContent className="py-8 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No badges earned yet</p>
          <Link href="/achievements">
            <Button variant="outline" size="sm" className="mt-4">
              View Achievements
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {displayBadges.map((ub) => {
            const badge = ub.badge;
            if (!badge) return null;
            
            return (
              <Tooltip key={ub.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center cursor-pointer',
                      'bg-gradient-to-br ring-2',
                      tierColors[badge.tier]
                    )}
                  >
                    <span className="text-sm">{badge.icon}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {badge.tier} • {badge.category}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {showAllLink && totalBadgeCount && totalBadgeCount > 5 && (
            <Link href="/achievements">
              <span className="text-xs text-muted-foreground hover:text-primary">
                +{totalBadgeCount - 5} more
              </span>
            </Link>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{totalPoints} pts</span>
            {showAllLink && (
              <Link href="/achievements">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <span className="hidden sm:inline mr-1">View All</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-wrap gap-3">
            {displayBadges.map((ub) => {
              const badge = ub.badge;
              if (!badge) return null;
              
              return (
                <Tooltip key={ub.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center cursor-pointer',
                        'bg-gradient-to-br ring-2 transition-transform hover:scale-110',
                        tierColors[badge.tier]
                      )}
                    >
                      <span className="text-xl">{badge.icon}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                    <p className="text-xs text-primary capitalize mt-1">
                      {badge.tier} • {badge.points} points
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
        
        {totalBadgeCount && totalBadgeCount > displayBadges.length && (
          <p className="text-xs text-muted-foreground mt-3">
            +{totalBadgeCount - displayBadges.length} more badges earned
          </p>
        )}
      </CardContent>
    </Card>
  );
}
