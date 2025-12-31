'use client';

/**
 * LeaderboardTable Component
 * Displays rankings with different metrics
 */

import React from 'react';
import { LeaderboardEntry } from '@/types/phase3';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, BookOpen, Flame, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  metric?: 'points' | 'books' | 'streak';
  showTabs?: boolean;
  onMetricChange?: (metric: string) => void;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="font-bold text-muted-foreground">{rank}</span>;
  }
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  metric,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  metric: string;
}) {
  const getValue = () => {
    switch (metric) {
      case 'books':
        return `${entry.booksRead} books`;
      case 'streak':
        return `${entry.currentStreak} days`;
      default:
        return `${entry.totalPoints} pts`;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg transition-colors',
        isCurrentUser ? 'bg-primary/10 border border-primary' : 'hover:bg-muted/50',
        rank <= 3 && 'bg-muted/30'
      )}
    >
      <div className="w-8 flex justify-center">{getRankIcon(rank)}</div>
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatarUrl} />
        <AvatarFallback>
          {(entry.fullName || entry.username || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{entry.fullName || entry.username}</p>
        <p className="text-xs text-muted-foreground">@{entry.username}</p>
      </div>
      <div className="text-right">
        <p className="font-bold">{getValue()}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Trophy className="h-3 w-3" />
          {entry.badgesEarned} badges
        </div>
      </div>
      {isCurrentUser && (
        <Badge variant="outline" className="ml-2">
          You
        </Badge>
      )}
    </div>
  );
}

export function LeaderboardTable({
  entries,
  currentUserId,
  metric = 'points',
  showTabs = true,
  onMetricChange,
}: LeaderboardTableProps) {
  const [activeMetric, setActiveMetric] = React.useState(metric);

  const handleMetricChange = (newMetric: string) => {
    setActiveMetric(newMetric as any);
    onMetricChange?.(newMetric);
  };

  const content = (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No rankings available yet.
        </div>
      ) : (
        entries.map((entry, index) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.userId === currentUserId}
            metric={activeMetric}
          />
        ))
      )}
    </div>
  );

  if (!showTabs) {
    return content;
  }

  return (
    <Tabs value={activeMetric} onValueChange={handleMetricChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="points" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Points
        </TabsTrigger>
        <TabsTrigger value="books" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Books
        </TabsTrigger>
        <TabsTrigger value="streak" className="flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Streak
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeMetric} className="mt-6">
        {content}
      </TabsContent>
    </Tabs>
  );
}
