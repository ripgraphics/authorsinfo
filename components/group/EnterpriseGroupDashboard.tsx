'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Import sub-components (to be created next)
import GroupAnalytics from './GroupAnalytics';
import ContentModeration from './ContentModeration';
import AuditLog from './AuditLog';
import PermissionsManager from './PermissionsManager';
import GroupSettings from './GroupSettings';
import MemberManagement from './MemberManagement';

interface EnterpriseGroupDashboardProps {
  groupId: string;
  userRole: string;
  permissions: {
    manageRoles: boolean;
    manageMembers: boolean;
    manageSettings: boolean;
    manageContent: boolean;
    viewAnalytics: boolean;
    moderateContent: boolean;
  };
}

export default function EnterpriseGroupDashboard({
  groupId,
  userRole,
  permissions,
}: EnterpriseGroupDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { toast } = useToast();

  useEffect(() => {
    async function fetchGroupData() {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select(`
            *,
            group_settings (*),
            group_analytics (
              total_members,
              active_members,
              new_members,
              total_content,
              new_content,
              engagement_metrics,
              content_metrics
            )
          `)
          .eq('id', groupId)
          .single();

        if (error) throw error;
        setGroupData(data);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Error',
          description: 'Failed to load group data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchGroupData();
  }, [groupId, supabase, toast]);

  if (loading) {
    return <div>Loading enterprise dashboard...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Group Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {permissions.viewAnalytics && (
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              )}
              {permissions.moderateContent && (
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
              )}
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
              {permissions.manageRoles && (
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              )}
              {permissions.manageSettings && (
                <TabsTrigger value="settings">Settings</TabsTrigger>
              )}
              {permissions.manageMembers && (
                <TabsTrigger value="members">Members</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {groupData?.group_analytics?.total_members || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {groupData?.group_analytics?.new_members || 0} new this week
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {groupData?.group_analytics?.active_members || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(
                        ((groupData?.group_analytics?.active_members || 0) /
                          (groupData?.group_analytics?.total_members || 1)) *
                          100
                      )}% engagement rate
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {groupData?.group_analytics?.total_content || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {groupData?.group_analytics?.new_content || 0} new this week
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {permissions.manageMembers && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('members')}
                      >
                        Manage Members
                      </Button>
                    )}
                    {permissions.moderateContent && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('moderation')}
                      >
                        Review Content
                      </Button>
                    )}
                    {permissions.manageSettings && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('settings')}
                      >
                        Group Settings
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AuditLog
                      groupId={groupId}
                      limit={5}
                      className="h-[200px] overflow-auto"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {permissions.viewAnalytics && (
              <TabsContent value="analytics">
                <GroupAnalytics groupId={groupId} />
              </TabsContent>
            )}

            {permissions.moderateContent && (
              <TabsContent value="moderation">
                <ContentModeration groupId={groupId} userRole={userRole} />
              </TabsContent>
            )}

            <TabsContent value="audit">
              <AuditLog groupId={groupId} />
            </TabsContent>

            {permissions.manageRoles && (
              <TabsContent value="permissions">
                <PermissionsManager groupId={groupId} />
              </TabsContent>
            )}

            {permissions.manageSettings && (
              <TabsContent value="settings">
                <GroupSettings groupId={groupId} userRole={userRole} />
              </TabsContent>
            )}

            {permissions.manageMembers && (
              <TabsContent value="members">
                <MemberManagement groupId={groupId} userRole={userRole} />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 