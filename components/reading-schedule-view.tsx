'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Book, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import Link from 'next/link';

interface Milestone {
  chapter?: number;
  page?: number;
  description: string;
  date: string;
}

interface ReadingSchedule {
  id: string;
  club_id: string;
  book_id: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  discussion_date?: string;
  milestones?: Milestone[];
  book?: {
    id: string;
    title: string;
    cover_image_url?: string;
    page_count?: number;
  };
  progress?: number; // User's progress percentage
}

interface ReadingScheduleViewProps {
  schedules: ReadingSchedule[];
  clubId: string;
  isOwner?: boolean;
  onEditSchedule?: (scheduleId: string) => void;
  onAddSchedule?: () => void;
}

export function ReadingScheduleView({
  schedules,
  clubId,
  isOwner = false,
  onEditSchedule,
  onAddSchedule,
}: ReadingScheduleViewProps) {
  const activeSchedules = schedules.filter((s) => s.status === 'active');
  const upcomingSchedules = schedules.filter((s) => s.status === 'upcoming');
  const completedSchedules = schedules.filter((s) => s.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Book className="h-4 w-4" />;
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return Math.max(0, days);
  };

  const ScheduleCard = ({ schedule }: { schedule: ReadingSchedule }) => {
    const daysRemaining = calculateDaysRemaining(schedule.end_date);
    const isOverdue = isPast(new Date(schedule.end_date)) && schedule.status === 'active';

    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {schedule.book?.cover_image_url && (
                <img
                  src={schedule.book.cover_image_url}
                  alt={schedule.book.title}
                  className="w-12 h-16 object-cover rounded"
                />
              )}
              <div>
                <CardTitle className="text-lg">
                  {schedule.book?.title || 'Untitled Book'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(schedule.status)} text-white`}
                  >
                    {getStatusIcon(schedule.status)}
                    <span className="ml-1 capitalize">{schedule.status}</span>
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {isOwner && onEditSchedule && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditSchedule(schedule.id)}
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Start Date
              </p>
              <p className="font-medium">{format(new Date(schedule.start_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                End Date
              </p>
              <p className="font-medium">{format(new Date(schedule.end_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {schedule.status === 'active' && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                </span>
                <span className="font-medium">{schedule.progress || 0}% complete</span>
              </div>
              <Progress value={schedule.progress || 0} className="h-2" />
            </div>
          )}

          {/* Discussion Date */}
          {schedule.discussion_date && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Discussion Date</span>
              </div>
              <span className="text-sm">
                {format(new Date(schedule.discussion_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Milestones */}
          {schedule.milestones && schedule.milestones.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Reading Milestones</h4>
              <div className="space-y-2">
                {schedule.milestones.map((milestone, index) => {
                  const milestoneDate = new Date(milestone.date);
                  const isPastMilestone = isPast(milestoneDate);

                  return (
                    <div
                      key={index}
                      className={`flex items-start justify-between p-2 rounded border ${
                        isPastMilestone
                          ? 'bg-muted border-muted'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isPastMilestone ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {milestone.chapter && `Chapter ${milestone.chapter}`}
                            {milestone.page && ` (Page ${milestone.page})`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(milestoneDate, 'MMM d')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Book Button */}
          {schedule.book?.id && (
            <Link href={`/books/${schedule.book.id}`}>
              <Button variant="outline" className="w-full">
                <Book className="h-4 w-4 mr-2" />
                View Book Details
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reading Schedule</h2>
          <p className="text-muted-foreground">
            Track your club's reading progress and milestones
          </p>
        </div>
        {isOwner && onAddSchedule && (
          <Button onClick={onAddSchedule}>
            <Calendar className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        )}
      </div>

      {/* Active Schedules */}
      {activeSchedules.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-green-500" />
            Currently Reading ({activeSchedules.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Schedules */}
      {upcomingSchedules.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Coming Up ({upcomingSchedules.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Schedules */}
      {completedSchedules.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-500" />
            Completed ({completedSchedules.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {schedules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reading Schedules Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isOwner
                ? 'Create your first reading schedule to get started'
                : "The club owner hasn't created any reading schedules yet"}
            </p>
            {isOwner && onAddSchedule && (
              <Button onClick={onAddSchedule}>
                <Calendar className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
