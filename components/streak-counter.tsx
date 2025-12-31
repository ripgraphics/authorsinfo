'use client';

/**
 * StreakCounter Component
 * Displays current and longest reading streaks with animation
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Calendar, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: string | null;
  showMilestones?: boolean;
  className?: string;
}

// Milestone achievements for streaks
const MILESTONES = [
  { days: 3, label: '3 Days', icon: '🔥' },
  { days: 7, label: 'Week Warrior', icon: '⭐' },
  { days: 14, label: 'Two Weeks', icon: '🌟' },
  { days: 30, label: 'Month Master', icon: '🏆' },
  { days: 60, label: '60 Days', icon: '💎' },
  { days: 90, label: 'Quarter Champion', icon: '👑' },
  { days: 180, label: 'Half Year Hero', icon: '🎖️' },
  { days: 365, label: 'Year Legend', icon: '🏅' },
];

export function StreakCounter({
  currentStreak,
  longestStreak,
  lastReadDate,
  showMilestones = false,
  className,
}: StreakCounterProps) {
  // Determine if streak is active (read today or yesterday)
  const isActive = React.useMemo(() => {
    if (!lastReadDate) return false;
    
    const last = new Date(lastReadDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastDateStr = last.toDateString();
    return lastDateStr === today.toDateString() || lastDateStr === yesterday.toDateString();
  }, [lastReadDate]);

  // Find current milestone and next milestone
  const { currentMilestone, nextMilestone, progress } = React.useMemo(() => {
    let current = null;
    let next = MILESTONES[0];
    
    for (let i = 0; i < MILESTONES.length; i++) {
      if (currentStreak >= MILESTONES[i].days) {
        current = MILESTONES[i];
        next = MILESTONES[i + 1] || null;
      }
    }
    
    const progressValue = next 
      ? ((currentStreak - (current?.days || 0)) / (next.days - (current?.days || 0))) * 100
      : 100;
    
    return { currentMilestone: current, nextMilestone: next, progress: progressValue };
  }, [currentStreak]);

  // Flame intensity based on streak length
  const flameIntensity = React.useMemo(() => {
    if (currentStreak === 0) return 'inactive';
    if (currentStreak < 3) return 'low';
    if (currentStreak < 7) return 'medium';
    if (currentStreak < 30) return 'high';
    return 'legendary';
  }, [currentStreak]);

  const flameStyles = {
    inactive: 'text-muted-foreground',
    low: 'text-orange-400',
    medium: 'text-orange-500 animate-pulse',
    high: 'text-orange-600 animate-pulse',
    legendary: 'text-red-500 animate-bounce',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Flame className={cn('h-5 w-5', flameStyles[flameIntensity])} />
            Reading Streak
          </span>
          {currentMilestone && (
            <Badge variant="secondary" className="text-lg">
              {currentMilestone.icon}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isActive ? 'Keep the momentum going!' : "Read today to maintain your streak!"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Streak Display */}
        <div className="flex items-center justify-around py-4">
          {/* Current Streak */}
          <div className="text-center">
            <div className={cn(
              'text-5xl font-bold mb-1',
              currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
            )}>
              {currentStreak}
            </div>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Flame className="h-4 w-4" />
              Current Streak
            </p>
          </div>
          
          {/* Divider */}
          <div className="h-16 w-px bg-border" />
          
          {/* Longest Streak */}
          <div className="text-center">
            <div className="text-5xl font-bold mb-1 text-primary">
              {longestStreak}
            </div>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4" />
              Best Streak
            </p>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to {nextMilestone.label}
              </span>
              <span className="font-medium">
                {currentStreak} / {nextMilestone.days} days
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {nextMilestone.days - currentStreak} days to go! {nextMilestone.icon}
            </p>
          </div>
        )}

        {/* Last Read Date */}
        {lastReadDate && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Last read: {new Date(lastReadDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}

        {/* Milestones Grid */}
        {showMilestones && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Streak Milestones
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {MILESTONES.map((milestone) => {
                const achieved = currentStreak >= milestone.days || longestStreak >= milestone.days;
                const current = currentMilestone?.days === milestone.days;
                
                return (
                  <div
                    key={milestone.days}
                    className={cn(
                      'p-2 rounded-lg text-center transition-all',
                      achieved 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-muted/50 opacity-50',
                      current && 'ring-2 ring-primary'
                    )}
                  >
                    <div className="text-2xl mb-1">{milestone.icon}</div>
                    <p className="text-xs font-medium truncate">{milestone.label}</p>
                    <p className="text-xs text-muted-foreground">{milestone.days}d</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Encouragement Message */}
        {currentStreak === 0 && (
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Start Your Streak Today!</p>
            <p className="text-xs text-muted-foreground">
              Log a reading session to begin building your streak
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
