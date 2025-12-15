import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  userId: string;
  isAdmin: boolean;
}

export default function WelcomeMessages({ groupId, userId, isAdmin }: Props) {
  const [messages, setMessages] = useState<WelcomeMessage[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    role_id: '',
    message: ''
  });
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    // Fetch welcome messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('group_welcome_messages')
      .select(`
        *,
        group_roles (
          id,
          name
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      toast.error('Failed to load welcome messages');
      return;
    }

    // Fetch group roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('group_roles')
      .select('id, name')
      .eq('group_id', groupId)
      .order('id', { ascending: true });

    if (rolesError) {
      toast.error('Failed to load group roles');
      return;
    }

    setMessages(messagesData);
    setRoles(rolesData);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only admins can create welcome messages');
      return;
    }

    const { error } = await (supabase
      .from('group_welcome_messages') as any)
      .insert({
        group_id: groupId,
        role_id: parseInt(formData.role_id),
        message: formData.message
      });

    if (error) {
      toast.error('Failed to create welcome message');
      return;
    }

    toast.success('Welcome message created');
    setShowForm(false);
    setFormData({ role_id: '', message: '' });
    fetchData();
  };

  const handleDelete = async (messageId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete welcome messages');
      return;
    }

    const { error } = await supabase
      .from('group_welcome_messages')
      .delete()
      .eq('id', messageId)
      .eq('group_id', groupId);

    if (error) {
      toast.error('Failed to delete welcome message');
      return;
    }

    toast.success('Welcome message deleted');
    fetchData();
  };

  if (isLoading) {
    return <div>Loading welcome messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Welcome Messages</h3>
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Message'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Welcome Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={formData.role_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter welcome message..."
                  required
                />
              </div>
              <Button type="submit">Create Message</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{message.group_roles.name}</CardTitle>
                </div>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(message.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{message.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 