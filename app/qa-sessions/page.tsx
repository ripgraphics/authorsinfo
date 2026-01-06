'use client';

import { useEffect, useState } from 'react';
import { useCommunityStore } from '@/lib/stores/community-store';
import { QASessionCard } from '@/components/qa-session-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Plus, Calendar, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function QASessionsPage() {
  const {
    qaSessions,
    qaSessionLoading,
    fetchQASessions,
    fetchMyQASessions,
  } = useCommunityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my-sessions'>('all');

  useEffect(() => {
    if (activeTab === 'all') {
      fetchQASessions();
    } else {
      fetchMyQASessions();
    }
  }, [activeTab, fetchQASessions, fetchMyQASessions]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredSessions = qaSessions.filter((session: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (session as any).title.toLowerCase().includes(query) ||
      (session as any).description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Q&A Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Join live Q&A sessions with authors and book experts
          </p>
        </div>
        <Link href="/qa-sessions/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaSessions.length}</div>
            <p className="text-xs text-muted-foreground">Active Q&A sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {qaSessions.filter((s) => s.status === 'live').length}
            </div>
            <p className="text-xs text-muted-foreground">Join ongoing sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {qaSessions.filter((s) => s.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">Sessions to look forward to</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'my-sessions')}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Sessions</TabsTrigger>
          <TabsTrigger value="my-sessions">My Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {qaSessionLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty State */}
          {!qaSessionLoading && filteredSessions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Q&A sessions found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {activeTab === 'my-sessions'
                    ? "You haven't created any Q&A sessions yet."
                    : 'No sessions match your current filters.'}
                </p>
                {activeTab === 'my-sessions' && (
                  <Link href="/qa-sessions/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Session
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sessions Grid */}
          {!qaSessionLoading && filteredSessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <QASessionCard
                  key={session.id}
                  session={session}
                  variant="default"
                  href={`/qa-sessions/${session.id}`}
                  showHost
                  showAuthor
                  showBook
                  showQuestionCount
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
