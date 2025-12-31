'use client';

/**
 * LeaderboardView Component
 * Full leaderboard view with global and friends tabs
 */

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/types/phase3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeaderboardTable } from './leaderboard-table';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { Globe, Users, RefreshCw, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardViewProps {
  currentUserId: string;
  showTitle?: boolean;
  initialTab?: 'global' | 'friends';
}

export function LeaderboardView({
  currentUserId,
  showTitle = true,
  initialTab = 'global',
}: LeaderboardViewProps) {
  const {
    leaderboard,
    friendsLeaderboard,
    loading,
    fetchLeaderboard,
    fetchFriendsLeaderboard,
  } = useGamificationStore();

  const [activeTab, setActiveTab] = useState<'global' | 'friends'>(initialTab);
  const [metric, setMetric] = useState<'points' | 'books' | 'streak'>('points');

  useEffect(() => {
    // Initial fetch
    fetchLeaderboard(metric, 20);
    fetchFriendsLeaderboard(metric);
  }, [fetchLeaderboard, fetchFriendsLeaderboard, metric]);

  const handleRefresh = () => {
    if (activeTab === 'global') {
      fetchLeaderboard(metric, 20);
    } else {
      fetchFriendsLeaderboard(metric);
    }
  };

  const handleMetricChange = (newMetric: string) => {
    setMetric(newMetric as 'points' | 'books' | 'streak');
  };

  // Find current user's rank
  const currentUserGlobalRank =
    leaderboard.findIndex((e: LeaderboardEntry) => e.userId === currentUserId) + 1;
  const currentUserFriendsRank =
    friendsLeaderboard.findIndex((e: LeaderboardEntry) => e.userId === currentUserId) + 1;

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                See how you rank against other readers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={cn('h-4 w-4', loading && 'animate-spin')}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(!showTitle && 'pt-6')}>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Global
              {currentUserGlobalRank > 0 && (
                <Badge variant="secondary" className="ml-1">
                  #{currentUserGlobalRank}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Friends
              {currentUserFriendsRank > 0 && (
                <Badge variant="secondary" className="ml-1">
                  #{currentUserFriendsRank}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="m-0">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading rankings...</p>
              </div>
            ) : (
              <LeaderboardTable
                entries={leaderboard}
                currentUserId={currentUserId}
                metric={metric}
                onMetricChange={handleMetricChange}
              />
            )}
          </TabsContent>

          <TabsContent value="friends" className="m-0">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading rankings...</p>
              </div>
            ) : friendsLeaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No friends yet</h3>
                <p className="text-muted-foreground text-sm">
                  Add friends to see how you rank against them!
                </p>
              </div>
            ) : (
              <LeaderboardTable
                entries={friendsLeaderboard}
                currentUserId={currentUserId}
                metric={metric}
                onMetricChange={handleMetricChange}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
