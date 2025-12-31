'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video,
  ExternalLink,
  Users,
  MessageCircle,
  UserCheck,
  UserX,
  Clock,
  Copy,
  Link as LinkIcon,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface VirtualEventSectionProps {
  eventId: string;
  isVirtual: boolean;
  meetingPlatform?: string;
  meetingUrl?: string;
  meetingPassword?: string;
  maxParticipants?: number;
  timezone?: string;
  startDate: string;
  endDate: string;
  status: string;
  userId?: string;
}

export function VirtualEventSection({
  eventId,
  isVirtual,
  meetingPlatform,
  meetingUrl,
  meetingPassword,
  maxParticipants,
  timezone = 'UTC',
  startDate,
  endDate,
  status,
  userId,
}: VirtualEventSectionProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [userRSVP, setUserRSVP] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  useEffect(() => {
    if (isVirtual) {
      fetchParticipants();
      if (userId) {
        checkUserRSVP();
      }
    }
  }, [eventId, isVirtual, userId]);

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const checkUserRSVP = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      if (response.ok) {
        const data = await response.json();
        const myRSVP = data.participants?.find((p: any) => p.user_id === userId);
        setUserRSVP(myRSVP);
        setHasCheckedIn(myRSVP?.attended || false);
      }
    } catch (error) {
      console.error('Error checking RSVP:', error);
    }
  };

  const handleRSVP = async (rsvpStatus: string) => {
    if (!userId) {
      toast.error('Please sign in to RSVP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: userRSVP ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp_status: rsvpStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to RSVP');
      }

      toast.success(`RSVP updated to: ${rsvpStatus}`);
      await fetchParticipants();
      await checkUserRSVP();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to RSVP');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!userId) {
      toast.error('Please sign in to check in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check in');
      }

      toast.success('Checked in successfully!');
      setHasCheckedIn(true);
      await fetchParticipants();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const openMeetingUrl = () => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isVirtual) {
    return null;
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const canCheckIn = now >= new Date(start.getTime() - 30 * 60 * 1000) && now <= end; // 30 min early
  const isLive = now >= start && now <= end;
  const hasEnded = now > end;

  const attendingCount = participants.filter(p => p.rsvp_status === 'attending').length;
  const capacityReached = maxParticipants && attendingCount >= maxParticipants;

  return (
    <div className="space-y-6">
      {/* Virtual Event Banner */}
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-full">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Virtual Event
                  {isLive && (
                    <Badge variant="destructive" className="animate-pulse">
                      ● LIVE
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isLive
                    ? 'Event is happening now!'
                    : hasEnded
                    ? 'Event has ended'
                    : `Starts ${formatDistanceToNow(start, { addSuffix: true })}`}
                </CardDescription>
              </div>
            </div>
            {meetingPlatform && (
              <Badge variant="outline" className="text-sm">
                {meetingPlatform}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meeting Details */}
          {meetingUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Meeting Link</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(meetingUrl, 'Meeting link')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={openMeetingUrl}
                    disabled={!canCheckIn || hasEnded}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {isLive ? 'Join Now' : 'Open Link'}
                  </Button>
                </div>
              </div>

              {meetingPassword && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Meeting Password</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                      {meetingPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(meetingPassword, 'Password')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* RSVP and Check-in Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!hasEnded && (
              <>
                {!userRSVP || userRSVP.rsvp_status !== 'attending' ? (
                  <Button
                    onClick={() => handleRSVP('attending')}
                    disabled={loading || capacityReached}
                    className="w-full"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {capacityReached ? 'Event Full' : 'RSVP: Attending'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleRSVP('not_attending')}
                    disabled={loading}
                    className="w-full"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Cancel RSVP
                  </Button>
                )}

                {canCheckIn && userRSVP?.rsvp_status === 'attending' && !hasCheckedIn && (
                  <Button
                    onClick={handleCheckIn}
                    disabled={loading}
                    variant="secondary"
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Capacity Info */}
          {maxParticipants && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Capacity:</span>
              <span className={`font-medium ${capacityReached ? 'text-red-500' : ''}`}>
                {attendingCount} / {maxParticipants} participants
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="attending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="attending">
                Attending ({participants.filter(p => p.rsvp_status === 'attending').length})
              </TabsTrigger>
              <TabsTrigger value="maybe">
                Maybe ({participants.filter(p => p.rsvp_status === 'maybe').length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({participants.length})
              </TabsTrigger>
            </TabsList>

            {(['attending', 'maybe', 'all'] as const).map((status) => (
              <TabsContent key={status} value={status} className="space-y-2">
                {participants
                  .filter((p) => status === 'all' || p.rsvp_status === status)
                  .map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {participant.user?.name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participant.role === 'host' && (
                              <Badge variant="secondary" className="mr-2">
                                Host
                              </Badge>
                            )}
                            {participant.attended && (
                              <Badge variant="outline" className="mr-2">
                                ✓ Checked In
                              </Badge>
                            )}
                            RSVP: {participant.rsvp_status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {participants.filter((p) => status === 'all' || p.rsvp_status === status)
                  .length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No participants with this status yet
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
