'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/database';

interface PermissionsManagerProps {
  groupId: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  is_custom: boolean;
  permissions: {
    manageRoles: boolean;
    manageMembers: boolean;
    manageSettings: boolean;
    manageContent: boolean;
    viewAnalytics: boolean;
    moderateContent: boolean;
    createContent: boolean;
    editContent: boolean;
    deleteContent: boolean;
    inviteMembers: boolean;
    removeMembers: boolean;
    [key: string]: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role_id: string;
  joined_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  role: Role;
}

export default function PermissionsManager({ groupId }: PermissionsManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {} as Role['permissions'],
  });
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false);

  const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { toast } = useToast();

  useEffect(() => {
    fetchRolesAndMembers();
  }, []);

  async function fetchRolesAndMembers() {
    try {
      setLoading(true);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('group_roles')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Fetch members with their roles
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:user_id(id, email, full_name),
          role:role_id(*)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load roles and members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRole() {
    try {
      const { data, error } = await (supabase
        .from('group_roles') as any)
        .insert({
          group_id: groupId,
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions,
          is_custom: true,
        })
        .select()
        .single();

      if (error) throw error;

      setRoles([...roles, data]);
      setShowNewRoleDialog(false);
      setNewRole({
        name: '',
        description: '',
        permissions: {} as Role['permissions'],
      });

      toast({
        title: 'Success',
        description: 'Role created successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateRole(role: Role) {
    try {
      const { error } = await (supabase
        .from('group_roles') as any)
        .update({
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', role.id);

      if (error) throw error;

      setRoles(roles.map(r => (r.id === role.id ? role : r)));
      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteRole(roleId: string) {
    try {
      const { error } = await supabase
        .from('group_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(roles.filter(r => r.id !== roleId));
      setSelectedRole(null);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateMemberRole(memberId: string, roleId: string) {
    try {
      const { error } = await (supabase
        .from('group_members') as any)
        .update({ role_id: roleId })
        .eq('id', memberId);

      if (error) throw error;

      // Refresh members list
      await fetchRolesAndMembers();
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

  const permissionsList = [
    { key: 'manageRoles', label: 'Manage Roles' },
    { key: 'manageMembers', label: 'Manage Members' },
    { key: 'manageSettings', label: 'Manage Settings' },
    { key: 'manageContent', label: 'Manage Content' },
    { key: 'viewAnalytics', label: 'View Analytics' },
    { key: 'moderateContent', label: 'Moderate Content' },
    { key: 'createContent', label: 'Create Content' },
    { key: 'editContent', label: 'Edit Content' },
    { key: 'deleteContent', label: 'Delete Content' },
    { key: 'inviteMembers', label: 'Invite Members' },
    { key: 'removeMembers', label: 'Remove Members' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="roles">
            <TabsList>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showNewRoleDialog} onOpenChange={setShowNewRoleDialog}>
                  <DialogTrigger asChild>
                    <Button>Create Role</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Role Name</Label>
                        <Input
                          id="name"
                          value={newRole.name}
                          onChange={(e) =>
                            setNewRole({ ...newRole, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newRole.description}
                          onChange={(e) =>
                            setNewRole({
                              ...newRole,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        {permissionsList.map(({ key, label }) => (
                          <div
                            key={key}
                            className="flex items-center justify-between"
                          >
                            <Label htmlFor={key}>{label}</Label>
                            <Switch
                              id={key}
                              checked={newRole.permissions[key] || false}
                              onCheckedChange={(checked) =>
                                setNewRole({
                                  ...newRole,
                                  permissions: {
                                    ...newRole.permissions,
                                    [key]: checked,
                                  },
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleCreateRole}>Create Role</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                  <CardContent className="p-4">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {roles.map((role) => (
                          <div
                            key={role.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedRole?.id === role.id
                                ? 'bg-primary/10'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedRole(role)}
                          >
                            <div className="font-medium">{role.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardContent className="p-4">
                    {selectedRole ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Role Name</Label>
                          <Input
                            id="edit-name"
                            value={selectedRole.name}
                            onChange={(e) =>
                              setSelectedRole({
                                ...selectedRole,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-description">Description</Label>
                          <Input
                            id="edit-description"
                            value={selectedRole.description}
                            onChange={(e) =>
                              setSelectedRole({
                                ...selectedRole,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Permissions</Label>
                          {permissionsList.map(({ key, label }) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <Label htmlFor={`edit-${key}`}>{label}</Label>
                              <Switch
                                id={`edit-${key}`}
                                checked={selectedRole.permissions[key] || false}
                                onCheckedChange={(checked) =>
                                  setSelectedRole({
                                    ...selectedRole,
                                    permissions: {
                                      ...selectedRole.permissions,
                                      [key]: checked,
                                    },
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between">
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteRole(selectedRole.id)}
                            disabled={!selectedRole.is_custom}
                          >
                            Delete Role
                          </Button>
                          <Button onClick={() => handleUpdateRole(selectedRole)}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a role to edit
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              {member.user.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.user.email}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              className="border rounded p-1"
                              value={member.role_id}
                              onChange={(e) =>
                                handleUpdateMemberRole(member.id, e.target.value)
                              }
                            >
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
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