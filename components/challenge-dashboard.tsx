'use client';

/**
 * ChallengeDashboard Component
 * Main view for user's reading challenges
 */

import React, { useEffect, useState } from 'react';
import { useChallengeStore } from '@/lib/stores/challenge-store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trophy, Loader2, Users } from 'lucide-react';
import { ChallengeCard, type ChallengeData } from '@/components/challenge-card';
import { CreateChallengeModal, type ChallengeSubmitData } from '@/components/create-challenge-modal';
import { ReadingStats, type ReadingStatsData } from '@/components/reading-stats';
import { useRouter } from 'next/navigation';

export function ChallengeDashboard() {
  const router = useRouter();
  const { 
    challenges, 
    friendsChallenges,
    loading, 
    error, 
    stats,
    fetchChallenges, 
    fetchFriendsChallenges,
    fetchStats,
    createChallenge 
  } = useChallengeStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchChallenges();
    fetchFriendsChallenges();
    fetchStats();
  }, [fetchChallenges, fetchFriendsChallenges, fetchStats]);

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  // Handle create challenge submission
  const handleCreateChallenge = async (data: ChallengeSubmitData) => {
    await createChallenge({
      title: data.title,
      description: data.description || undefined,
      goalType: data.goalType,
      goalValue: data.goalValue,
      startDate: data.startDate,
      endDate: data.endDate,
      isPublic: data.isPublic,
    });
    await fetchChallenges();
  };

  // Handle view challenge details
  const handleViewDetails = (challengeId: string) => {
    router.push(`/reading-challenge/${challengeId}`);
  };

  // Map store challenges to ChallengeData type
  const mapChallenge = (c: any): ChallengeData => ({
    id: c.id,
    title: c.title,
    description: c.description,
    goalType: c.goalType,
    goalValue: c.goalValue,
    currentValue: c.currentValue || 0,
    startDate: c.startDate,
    endDate: c.endDate,
    challengeYear: c.challengeYear,
    status: c.status,
    isPublic: c.isPublic,
    user: c.user,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reading Challenges</h1>
          <p className="text-muted-foreground">
            Set goals, track your progress, and stay motivated.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Challenge
        </Button>
      </div>

      <ReadingStats stats={stats as ReadingStatsData | null} />

      {/* Challenges Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeChallenges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeChallenges.map((challenge) => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={mapChallenge(challenge)}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium">No active challenges</h3>
              <p className="text-muted-foreground mb-6">
                Ready to start a new reading goal?
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                Create Challenge
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedChallenges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedChallenges.map((challenge) => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={mapChallenge(challenge)}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No completed challenges yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="friends" className="mt-6">
          {friendsChallenges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friendsChallenges.map((challenge) => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={mapChallenge(challenge)}
                  onViewDetails={handleViewDetails}
                  showUser={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No friend challenges found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateChallengeModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateChallenge}
      />
    </div>
  );
}
