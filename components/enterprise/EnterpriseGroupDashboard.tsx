'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/database';

// Import enterprise components
import GroupAnalytics from '../group/GroupAnalytics';
import ContentModeration from '../group/ContentModeration';
import AuditLog from '../group/AuditLog';
import PermissionsManager from '../group/PermissionsManager';
import GroupSettings from '../group/GroupSettings';
import MemberManagement from '../group/MemberManagement';

interface EnterpriseGroupDashboardProps {
  groupId: string;
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_role: string;
  member_count: number;
  content_count: number;
  activity_count: number;
}

export default function EnterpriseGroupDashboard({ groupId }: EnterpriseGroupDashboardProps) {
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  useEffect(() => {
    fetchGroupData();
  }, [groupId]); // Added groupId dependency

  async function fetchGroupData() {
    try {
      setLoading(true);
      setError(null);

      // First fetch basic group data
      const { data: basicGroupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Fetch member count
      const { count: memberCount, error: memberError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (memberError) throw memberError;

      // Fetch content count
      const { count: contentCount, error: contentError } = await supabase
        .from('group_content')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (contentError) throw contentError;

      // Fetch activity count
      const { count: activityCount, error: activityError } = await supabase
        .from('group_activities')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (activityError) throw activityError;

      // Get current user's role
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        const { data: memberData, error: roleError } = await supabase
          .from('group_members')
          .select('role_id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();

        if (!roleError && memberData) {
          // Fetch role name
          const { data: roleData, error: roleNameError } = await supabase
            .from('roles')
            .select('name')
            .eq('id', memberData.role_id)
            .single();

          if (!roleNameError && roleData) {
            setUserRole(roleData.name);
          }
        }
      }

      setGroupData({
        ...basicGroupData,
        member_count: memberCount || 0,
        content_count: contentCount || 0,
        activity_count: activityCount || 0
      });

    } catch (err: any) {
      console.error('Error fetching group data:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load group data: ' + err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading enterprise dashboard...</div>;
  }

  if (error || !groupData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || 'Failed to load group data'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groupData.member_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groupData.content_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groupData.activity_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <GroupAnalytics groupId={groupId} />
            </TabsContent>

            <TabsContent value="members">
              <MemberManagement groupId={groupId} userRole={userRole} />
            </TabsContent>

            <TabsContent value="moderation">
              <ContentModeration groupId={groupId} userRole={userRole} />
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsManager groupId={groupId} />
            </TabsContent>

            <TabsContent value="audit">
              <AuditLog groupId={groupId} />
            </TabsContent>

            <TabsContent value="settings">
              <GroupSettings groupId={groupId} userRole={userRole} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 