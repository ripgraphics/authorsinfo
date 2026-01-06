'use client';

/**
 * Challenge Details Page
 * View progress and log activity for a specific challenge
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChallengeStore } from '@/lib/stores/challenge-store';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Calendar, 
  BookOpen, 
  Plus, 
  ChevronLeft, 
  Loader2, 
  History,
  Settings,
  Trash2
} from 'lucide-react';
import { UUID } from 'crypto';
import { toast } from 'sonner';
import { 
  LogProgressModal, 
  type ProgressLogData, 
  type ProgressChallengeData 
} from '@/components/log-progress-modal';
import { 
  ShareProgressButton, 
  type ShareableChallengeData 
} from '@/components/share-progress-button';

export default function ChallengeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as UUID;
  
  const { 
    challengeDetails, 
    loading, 
    fetchChallengeById, 
    deleteChallenge,
    logProgress
  } = useChallengeStore();
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  useEffect(() => {
    if (challengeId) {
      fetchChallengeById(challengeId);
    }
  }, [challengeId, fetchChallengeById]);

  const challenge = challengeDetails[challengeId];

  if (loading && !challenge) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!challenge) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Challenge not found</h2>
          <Button variant="link" onClick={() => router.push('/reading-challenge')}>
            Back to challenges
          </Button>
        </div>
      </PageContainer>
    );
  }

  const progress = Math.min(
    Math.round((challenge.currentValue / challenge.goalValue) * 100),
    100
  );

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      await deleteChallenge(challengeId);
      toast.success('Challenge deleted');
      router.push('/reading-challenge');
    }
  };

  // Handle progress logging with reusable component
  const handleLogProgress = async (data: ProgressLogData) => {
    await logProgress(challengeId, {
      pagesRead: data.pagesRead || data.value,
      minutesRead: data.minutesRead,
    });
    // Refresh challenge data
    await fetchChallengeById(challengeId);
  };

  // Map challenge to ProgressChallengeData for LogProgressModal
  const progressChallenge: ProgressChallengeData = {
    id: challenge.id,
    title: challenge.title,
    goalType: challenge.goalType as any,
    currentValue: challenge.currentValue,
    goalValue: challenge.goalValue,
  };

  // Map challenge to ShareableChallengeData for ShareProgressButton
  const shareableChallenge: ShareableChallengeData = {
    id: challenge.id,
    title: challenge.title,
    currentValue: challenge.currentValue,
    goalValue: challenge.goalValue,
    goalType: challenge.goalType,
  };

  // Type-safe tracking access
  const tracking = (challenge as any).tracking as Array<{
    id: string;
    pages_read?: number;
    minutes_read?: number;
    date_added: string;
  }> | undefined;

  return (
    <PageContainer>
      <div className="py-8 space-y-8">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/reading-challenge')} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Challenges
          </Button>
          <div className="flex items-center gap-2">
            <ShareProgressButton 
              challenge={shareableChallenge}
              showDropdown={true}
              destinations={['feed', 'clipboard', 'twitter']}
            />
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Challenge Header */}
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline">{challenge.challengeYear}</Badge>
                <Badge variant={challenge.status === 'completed' ? 'default' : 'secondary'}>
                  {challenge.status.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold">{challenge.title}</h1>
              {challenge.description && (
                <p className="text-muted-foreground mt-2 text-lg">{challenge.description}</p>
              )}
            </div>

            <Card>
              <CardContent className="pt-4 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Progress</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{challenge.currentValue}</span>
                      <span className="text-muted-foreground">/ {challenge.goalValue} {challenge.goalType}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary">{progress}%</span>
                  </div>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ends {new Date(challenge.endDate).toLocaleDateString()}
                  </div>
                  {challenge.status === 'completed' && (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <Trophy className="h-4 w-4" />
                      Completed!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Log Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90">
                  Keep your challenge up to date by logging your reading activity.
                </p>
                <Button 
                  className="w-full bg-white text-primary hover:bg-white/90" 
                  onClick={() => setIsLogModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Log Activity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tracking && tracking.length > 0 ? (
                  <div className="space-y-4">
                    {tracking.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                        <div className="mt-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {log.pages_read ? `Read ${log.pages_read} pages` : 
                             log.minutes_read ? `Read for ${log.minutes_read} mins` : 
                             'Logged activity'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.date_added).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity logged yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LogProgressModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        challenge={progressChallenge}
        onSubmit={handleLogProgress}
        showDatePicker={true}
        showCurrentProgress={true}
      />
    </PageContainer>
  );
}
