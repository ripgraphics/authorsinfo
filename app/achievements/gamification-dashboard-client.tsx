'use client';

/**
 * Gamification Dashboard Client Component
 * Interactive display of badges, achievements, and leaderboards
 */

import React, { useEffect, useState } from 'react';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { BadgeGrid } from '@/components/badge-grid';
import { LeaderboardView } from '@/components/leaderboard-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Trophy, 
  Target, 
  Star, 
  Flame, 
  BookOpen,
  Users,
  Sparkles,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface GamificationDashboardClientProps {
  userId: string;
}

export function GamificationDashboardClient({ userId }: GamificationDashboardClientProps) {
  const {
    badges,
    userBadges,
    featuredBadges,
    badgeProgress,
    totalPoints,
    loading,
    fetchBadges,
    fetchUserBadges,
  } = useGamificationStore();

  useEffect(() => {
    fetchBadges();
    fetchUserBadges();
  }, [fetchBadges, fetchUserBadges]);

  // Calculate statistics
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  const earnedBadges = badges.filter(b => earnedBadgeIds.has(b.id));
  const totalBadges = badges.filter(b => !b.isSecret).length;
  const percentComplete = totalBadges > 0 
    ? Math.round((earnedBadges.length / totalBadges) * 100) 
    : 0;

  // Group badges by tier for stats
  const tierStats = {
    bronze: earnedBadges.filter(b => b.tier === 'bronze').length,
    silver: earnedBadges.filter(b => b.tier === 'silver').length,
    gold: earnedBadges.filter(b => b.tier === 'gold').length,
    platinum: earnedBadges.filter(b => b.tier === 'platinum').length,
    diamond: earnedBadges.filter(b => b.tier === 'diamond').length,
  };

  // Find badges close to completion
  const nearlyComplete = badgeProgress
    .filter(bp => bp.progressPercent >= 70 && bp.progressPercent < 100)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 3);

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your reading achievements and compete with friends
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">Total Points</div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{earnedBadges.length}</p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </div>
              <Award className="h-8 w-8 text-amber-500" />
            </div>
            <Progress value={percentComplete} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {percentComplete}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{tierStats.gold + tierStats.platinum + tierStats.diamond}</p>
                <p className="text-sm text-muted-foreground">Rare Badges</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex gap-1 mt-3">
              {tierStats.gold > 0 && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                  {tierStats.gold} Gold
                </Badge>
              )}
              {tierStats.platinum > 0 && (
                <Badge variant="outline" className="bg-cyan-100 text-cyan-800 text-xs">
                  {tierStats.platinum} Platinum
                </Badge>
              )}
              {tierStats.diamond > 0 && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                  {tierStats.diamond} Diamond
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{featuredBadges.length}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Show off up to 5 badges on your profile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{nearlyComplete.length}</p>
                <p className="text-sm text-muted-foreground">Almost Done</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Badges you're close to earning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Nearly Complete Section */}
      {nearlyComplete.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Almost There!
            </CardTitle>
            <CardDescription>
              Keep going - you're close to unlocking these badges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {nearlyComplete.map((bp) => {
                const badge = bp.badge;
                if (!badge) return null;
                
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{badge.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={bp.progressPercent} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(bp.progressPercent)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            My Badges
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading badges...</p>
              </CardContent>
            </Card>
          ) : (
            <BadgeGrid
              badges={badges}
              userBadges={userBadges}
            />
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardView currentUserId={userId} />
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Earn More Achievements</CardTitle>
          <CardDescription>
            Complete these activities to unlock new badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/reading-challenge" className="block group">
              <div className="p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Reading Challenges</p>
                      <p className="text-xs text-muted-foreground">
                        Complete challenges to earn badges
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/books" className="block group">
              <div className="p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Read More Books</p>
                      <p className="text-xs text-muted-foreground">
                        Unlock milestones at 10, 50, 100+ books
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/friends" className="block group">
              <div className="p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Connect with Friends</p>
                      <p className="text-xs text-muted-foreground">
                        Social badges for community activity
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
