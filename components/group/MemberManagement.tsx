'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface MemberManagementProps {
  groupId: string;
  userRole: string;
}

interface Member {
  id: string;
  user_id: string;
  role_id: string;
  status: 'active' | 'suspended' | 'banned';
  joined_at: string;
  last_active: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  role: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Invitation {
  id: string;
  email: string;
  role_id: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  role: {
    id: string;
    name: string;
  };
}

export default function MemberManagement({ groupId, userRole }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchMembersAndRoles();
  }, []);

  async function fetchMembersAndRoles() {
    try {
      setLoading(true);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:user_id(*),
          role:role_id(*)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('group_roles')
        .select('*')
        .eq('group_id', groupId);

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Fetch invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('group_invitations')
        .select(`
          *,
          role:role_id(*)
        `)
        .eq('group_id', groupId)
        .not('status', 'eq', 'expired');

      if (invitationsError) throw invitationsError;
      setInvitations(invitationsData || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load members and roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteMember() {
    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          email: inviteEmail,
          role_id: inviteRole,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      setInvitations([...invitations, data]);
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('');

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateMemberStatus(memberId: string, status: Member['status']) {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ status })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.map(m => (m.id === memberId ? { ...m, status } : m)));
      toast({
        title: 'Success',
        description: `Member ${status} successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update member status',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateMemberRole(memberId: string, roleId: string) {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role_id: roleId })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(
        members.map(m =>
          m.id === memberId
            ? {
                ...m,
                role_id: roleId,
                role: roles.find(r => r.id === roleId) || m.role,
              }
            : m
        )
      );

      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
      setSelectedMember(null);
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;

      setInvitations(invitations.filter(i => i.id !== invitationId));
      toast({
        title: 'Success',
        description: 'Invitation cancelled successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || member.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Member Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[300px]"
                  />
                  <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button>Invite Member</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite New Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleInviteMember}
                        disabled={!inviteEmail || !inviteRole}
                      >
                        Send Invitation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                  <CardContent className="p-4">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedMember?.id === member.id
                                ? 'bg-primary/10'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedMember(member)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {member.user.full_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {member.user.email}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  member.status === 'active'
                                    ? 'default' 
                                    : 'destructive'
                                }
                              >
                                {member.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardContent className="p-4">
                    {selectedMember ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={selectedMember.role_id}
                            onValueChange={(value) =>
                              handleUpdateMemberRole(selectedMember.id, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Status</Label>
                          <Select
                            value={selectedMember.status}
                            onValueChange={(value: Member['status']) =>
                              handleUpdateMemberStatus(selectedMember.id, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="banned">Banned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Member Since</Label>
                          <div className="text-sm text-muted-foreground">
                            {new Date(
                              selectedMember.joined_at
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        <div>
                          <Label>Last Active</Label>
                          <div className="text-sm text-muted-foreground">
                            {new Date(
                              selectedMember.last_active
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveMember(selectedMember.id)}
                        >
                          Remove Member
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a member to manage
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="invitations">
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{invitation.email}</div>
                            <div className="text-sm text-muted-foreground">
                              Role: {invitation.role.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Expires:{' '}
                              {new Date(
                                invitation.expires_at
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                invitation.status === 'pending'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {invitation.status}
                            </Badge>
                            {invitation.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCancelInvitation(invitation.id)
                                }
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 