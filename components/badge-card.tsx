'use client';

/**
 * BadgeCard Component
 * Displays a single badge with tier styling
 */

import React from 'react';
import { Badge } from '@/types/phase3';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
  badge: Badge;
  isEarned?: boolean;
  earnedAt?: Date;
  progress?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const tierColors: Record<string, { bg: string; border: string; text: string }> = {
  bronze: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  silver: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700' },
  gold: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700' },
  platinum: { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700' },
  diamond: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
};

export function BadgeCard({
  badge,
  isEarned = false,
  earnedAt,
  progress,
  onClick,
  size = 'md',
}: BadgeCardProps) {
  const colors = tierColors[badge.tier] || tierColors.bronze;

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all cursor-pointer hover:shadow-md',
        colors.bg,
        colors.border,
        'border-2',
        !isEarned && 'opacity-50 grayscale',
        sizeClasses[size]
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 flex flex-col items-center text-center">
        <div className={cn('mb-2', iconSizes[size])}>{badge.icon}</div>
        <h3 className={cn('font-semibold', colors.text, size === 'sm' ? 'text-xs' : 'text-sm')}>
          {badge.name}
        </h3>
        {size !== 'sm' && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
        )}
        {size !== 'sm' && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn('text-xs font-medium', colors.text)}>
              {badge.points} pts
            </span>
            <span className="text-xs text-muted-foreground capitalize">• {badge.tier}</span>
          </div>
        )}
        {progress !== undefined && !isEarned && (
          <div className="w-full mt-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', 'bg-primary')}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        )}
        {isEarned && earnedAt && size !== 'sm' && (
          <p className="text-xs text-muted-foreground mt-2">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
