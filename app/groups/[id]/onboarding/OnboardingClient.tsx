'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  task: string;
  order_index: number;
  completed?: boolean;
}

interface Checklist {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
}

interface WelcomeMessage {
  id: string;
  role_id: number;
  message: string;
  group_roles: {
    id: number;
    name: string;
  };
}

interface Props {
  groupId: string;
  welcomeMessages: WelcomeMessage[];
  checklists: Checklist[];
}

export default function OnboardingClient({ groupId, welcomeMessages, checklists }: Props) {
  const [userRole, setUserRole] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ [taskId: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, [groupId]);

  const fetchUserData = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Get user's role in the group
    const { data: member } = await supabase
      .from('group_members')
      .select('role_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (member) {
      setUserRole(member.role_id);
    }

    // Get user's progress
    const { data: progressData } = await supabase
      .from('group_onboarding_progress')
      .select('task_id')
      .eq('user_id', user.id);

    if (progressData) {
      const progressMap = progressData.reduce((acc, curr) => ({
        ...acc,
        [curr.task_id]: true
      }), {});
      setProgress(progressMap);
    }

    setIsLoading(false);
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (completed) {
      const { error } = await supabase
        .from('group_onboarding_progress')
        .insert({
          checklist_id: checklists.find(c => c.tasks.some(t => t.id === taskId))?.id,
          user_id: user.id,
          task_id: taskId,
          completed_at: new Date().toISOString()
        });

      if (error) {
        toast.error('Failed to mark task as complete');
        return;
      }
    } else {
      const { error } = await supabase
        .from('group_onboarding_progress')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to mark task as incomplete');
        return;
      }
    }

    setProgress(prev => ({
      ...prev,
      [taskId]: completed
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const userWelcomeMessage = welcomeMessages.find(m => m.role_id === userRole);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {userWelcomeMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Group!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{userWelcomeMessage.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Getting Started</h2>
        {checklists.map((checklist) => (
          <Card key={checklist.id}>
            <CardHeader>
              <CardTitle>{checklist.title}</CardTitle>
              <p className="text-sm text-gray-500">{checklist.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checklist.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <Checkbox
                      checked={progress[task.id] || false}
                      onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                    />
                    <span className={progress[task.id] ? 'line-through text-gray-500' : ''}>
                      {task.task}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => router.push(`/groups/${groupId}`)}>
          Go to Group
        </Button>
      </div>
    </div>
  );
} 