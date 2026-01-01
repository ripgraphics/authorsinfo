'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCommunityStore } from '@/lib/stores/community-store';
import { QASessionCard } from '@/components/qa-session-card';
import { QuestionSubmission } from '@/components/question-submission';
import { LiveQAFeed } from '@/components/live-qa-feed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  Video,
  ExternalLink,
  Share2,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

export default function QASessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const {
    currentQASession,
    qaSessionLoading,
    fetchQASession,
    deleteQASession,
    clearCurrentQASession,
  } = useCommunityStore();

  const [activeTab, setActiveTab] = useState<'questions' | 'about' | 'participants'>('questions');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchQASession(sessionId);
    }

    return () => {
      clearCurrentQASession();
    };
  }, [sessionId, fetchQASession, clearCurrentQASession]);

  const handleDelete = async () => {
    if (!currentQASession) return;

    if (!confirm('Are you sure you want to delete this Q&A session?')) return;

    setIsDeleting(true);
    try {
      await deleteQASession(currentQASession.id);
      toast.success('Q&A session deleted successfully');
      router.push('/qa-sessions');
    } catch (error) {
      toast.error('Failed to delete session');
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    if (!currentQASession) return;

    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleQuestionSubmit = async (data: { questionText: string; isAnonymous: boolean }) => {
    try {
      const response = await fetch(`/api/qa-sessions/${sessionId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: data.questionText,
          is_anonymous: data.isAnonymous,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit question');
      }

      toast.success('Question submitted successfully!');
      // Refresh the feed
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit question');
      throw error;
    }
  };

  if (qaSessionLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentQASession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Session not found</h3>
            <p className="text-muted-foreground text-center mb-4">
              This Q&A session doesn't exist or has been removed.
            </p>
            <Link href="/qa-sessions">
              <Button>Browse Sessions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLive = currentQASession.status === 'live';
  const isUpcoming = currentQASession.status === 'scheduled';
  const isAcceptingQuestions = currentQASession.status === 'accepting_questions' || isLive;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isLive ? 'destructive' : 'secondary'}>
                {isLive && <span className="animate-pulse mr-1">●</span>}
                {currentQASession.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant="outline">{currentQASession.sessionType}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{currentQASession.title}</h1>
            {currentQASession.description && (
              <p className="text-muted-foreground text-lg">{currentQASession.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {/* TODO: Add owner check */}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/qa-sessions/${sessionId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Session Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Start Time</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {format(new Date(currentQASession.scheduledStart), 'MMM d')}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(currentQASession.scheduledStart), 'h:mm a')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {Math.round(
                  (new Date(currentQASession.scheduledEnd).getTime() -
                    new Date(currentQASession.scheduledStart).getTime()) /
                    (1000 * 60)
                )}
                m
              </div>
              <p className="text-xs text-muted-foreground">Session length</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {/* TODO: Get actual count from API */}
                0
              </div>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {/* TODO: Get actual count from API */}
                0
              </div>
              <p className="text-xs text-muted-foreground">Attending</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Video Section (if live) */}
      {isLive && (
        <Card className="mb-8 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Session
            </CardTitle>
            <CardDescription>Join the live Q&A session now</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Live Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          {/* Question Submission */}
          {isAcceptingQuestions && (
            <Card>
              <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
                <CardDescription>
                  Submit your question for this Q&A session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionSubmission
                  onSubmit={handleQuestionSubmit}
                  allowAnonymous={(currentQASession as any).allow_anonymous}
                  maxLength={500}
                />
              </CardContent>
            </Card>
          )}

          {/* Live Questions Feed */}
          <LiveQAFeed
            sessionId={sessionId}
            autoRefresh={isLive}
            autoRefreshInterval={isLive ? 10000 : 30000}
            onFetchQuestions={async () => []}
            onVoteQuestion={async () => {}}
          />
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About This Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {currentQASession.description || 'No description provided.'}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Session Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Type:</dt>
                      <dd className="font-medium">{(currentQASession as any).sessionType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="font-medium">{currentQASession.status}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Max Questions:</dt>
                      <dd className="font-medium">
                        {(currentQASession as any).maxQuestions || 'Unlimited'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Public:</dt>
                      <dd className="font-medium">
                        {(currentQASession as any).isPublic ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Settings</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Requires Approval:</dt>
                      <dd className="font-medium">
                        {(currentQASession as any).requiresApproval ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Anonymous Questions:</dt>
                      <dd className="font-medium">
                        {(currentQASession as any).allowAnonymous ? 'Allowed' : 'Not Allowed'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* TODO: Add Host, Author, Book info when available from API */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>People attending this Q&A session</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Participant list coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
