'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Book,
  MessageCircle,
  Calendar,
  TrendingUp,
  Award,
  Settings,
  UserPlus,
  Crown,
} from 'lucide-react';
import { ReadingScheduleView } from './reading-schedule-view';
import { Progress } from '@/components/ui/progress';

interface BookClubMember {
  id: string;
  user_id: string;
  role: 'owner' | 'moderator' | 'member';
  status: 'active' | 'inactive';
  joined_at: string;
  books_completed: number;
  discussions_participated: number;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

interface BookClubDashboardProps {
  club: {
    id: string;
    name: string;
    description?: string;
    cover_image_url?: string;
    reading_pace: string;
    meeting_frequency: string;
    preferred_genres?: string[];
    max_members?: number;
    status: string;
  };
  members: BookClubMember[];
  readingSchedules: any[];
  userId?: string;
  isOwner: boolean;
  isMember: boolean;
  onEditClub?: () => void;
  onInviteMembers?: () => void;
  onLeaveClub?: () => void;
  onJoinClub?: () => void;
}

export function BookClubDashboard({
  club,
  members,
  readingSchedules,
  userId,
  isOwner,
  isMember,
  onEditClub,
  onInviteMembers,
  onLeaveClub,
  onJoinClub,
}: BookClubDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const activeMembers = members.filter((m) => m.status === 'active');
  const activeSchedules = readingSchedules.filter((s) => s.status === 'active');
  const completedBooks = readingSchedules.filter((s) => s.status === 'completed').length;
  
  // Calculate member statistics
  const topReaders = [...members]
    .sort((a, b) => b.books_completed - a.books_completed)
    .slice(0, 5);
  
  const mostActive = [...members]
    .sort((a, b) => b.discussions_participated - a.discussions_participated)
    .slice(0, 5);

  const MemberCard = ({ member }: { member: BookClubMember }) => {
    const roleColor = {
      owner: 'text-yellow-600 bg-yellow-50',
      moderator: 'text-blue-600 bg-blue-50',
      member: 'text-gray-600 bg-gray-50',
    }[member.role];

    const roleIcon = {
      owner: <Crown className="h-3 w-3" />,
      moderator: <Award className="h-3 w-3" />,
      member: null,
    }[member.role];

    return (
      <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={member.user?.avatar_url} />
            <AvatarFallback>
              {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium flex items-center gap-2">
              {member.user?.name || 'Anonymous'}
              <Badge variant="secondary" className={`${roleColor} text-xs flex items-center gap-1`}>
                {roleIcon}
                {member.role}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              {member.books_completed} books · {member.discussions_participated} discussions
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Club Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              {club.cover_image_url && (
                <img
                  src={club.cover_image_url}
                  alt={club.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold mb-2">{club.name}</h1>
                {club.description && (
                  <p className="text-muted-foreground mb-3">{club.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {activeMembers.length} {club.max_members ? `/ ${club.max_members}` : ''} members
                  </Badge>
                  <Badge variant="outline">
                    <Book className="h-3 w-3 mr-1" />
                    {completedBooks} books completed
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {club.meeting_frequency}
                  </Badge>
                  <Badge variant="outline">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {club.reading_pace} pace
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwner && onEditClub && (
                <Button variant="outline" size="sm" onClick={onEditClub}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
              {isMember && onInviteMembers && (
                <Button variant="outline" size="sm" onClick={onInviteMembers}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              )}
              {isMember && !isOwner && onLeaveClub && (
                <Button variant="outline" size="sm" onClick={onLeaveClub}>
                  Leave Club
                </Button>
              )}
              {!isMember && onJoinClub && (
                <Button size="sm" onClick={onJoinClub}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Club
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Reading Schedule</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeMembers.length}</div>
                {club.max_members && (
                  <Progress
                    value={(activeMembers.length / club.max_members) * 100}
                    className="mt-2"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {club.max_members
                    ? `${Math.round((activeMembers.length / club.max_members) * 100)}% capacity`
                    : 'Unlimited capacity'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Books Completed</CardTitle>
                <Book className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedBooks}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {activeSchedules.length} currently reading
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Discussions</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {members.reduce((sum, m) => sum + m.discussions_participated, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total discussions participated
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Readers & Most Active */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Readers 📚</CardTitle>
                <CardDescription>Members who have completed the most books</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topReaders.length > 0 ? (
                  topReaders.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatar_url} />
                        <AvatarFallback>
                          {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.user?.name || 'Anonymous'}</p>
                      </div>
                      <Badge variant="secondary">{member.books_completed} books</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No completed books yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Active 💬</CardTitle>
                <CardDescription>Members with the most discussion participation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {mostActive.length > 0 ? (
                  mostActive.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatar_url} />
                        <AvatarFallback>
                          {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.user?.name || 'Anonymous'}</p>
                      </div>
                      <Badge variant="secondary">{member.discussions_participated} posts</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No discussions yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <ReadingScheduleView
            schedules={readingSchedules}
            clubId={club.id}
            isOwner={isOwner}
          />
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Club Members ({activeMembers.length})</h3>
              <p className="text-sm text-muted-foreground">
                All active members of this book club
              </p>
            </div>
            {isMember && onInviteMembers && (
              <Button onClick={onInviteMembers}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>

          {activeMembers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Be the first to join this book club!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Discussions Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Club discussions will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
