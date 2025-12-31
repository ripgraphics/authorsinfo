'use client';

/**
 * BadgeGrid Component
 * Displays badges organized by category
 */

import React from 'react';
import { Badge, UserBadge } from '@/types/phase3';
import { BadgeCard } from './badge-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Trophy, Flame, Target, Sparkles } from 'lucide-react';

interface BadgeGridProps {
  badges: Badge[];
  userBadges?: UserBadge[];
  onBadgeClick?: (badge: Badge) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  reading: <BookOpen className="h-4 w-4" />,
  social: <Users className="h-4 w-4" />,
  challenge: <Trophy className="h-4 w-4" />,
  streak: <Flame className="h-4 w-4" />,
  milestone: <Target className="h-4 w-4" />,
  special: <Sparkles className="h-4 w-4" />,
};

export function BadgeGrid({ badges, userBadges = [], onBadgeClick }: BadgeGridProps) {
  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  // Create a map of earned badges
  const earnedBadgeMap = new Map(
    userBadges.map((ub) => [ub.badgeId, ub])
  );

  const categories = Object.keys(badgesByCategory);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No badges available yet.
      </div>
    );
  }

  return (
    <Tabs defaultValue={categories[0]} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)` }}>
        {categories.map((category) => (
          <TabsTrigger key={category} value={category} className="flex items-center gap-2 capitalize">
            {categoryIcons[category]}
            <span className="hidden sm:inline">{category}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category} value={category} className="mt-6">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {badgesByCategory[category]
              .sort((a, b) => a.requirementValue - b.requirementValue)
              .map((badge) => {
                const userBadge = earnedBadgeMap.get(badge.id);
                return (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isEarned={!!userBadge}
                    earnedAt={userBadge?.earnedAt}
                    onClick={() => onBadgeClick?.(badge)}
                  />
                );
              })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
