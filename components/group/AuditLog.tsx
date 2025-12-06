'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/database';

interface AuditLogProps {
  groupId: string;
  limit?: number;
  className?: string;
}

interface AuditLogEntry {
  id: string;
  group_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  metadata: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export default function AuditLog({ groupId, limit, className }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    to: new Date(),
  });
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
  });

  const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLog();
  }, [dateRange, filters]);

  async function fetchAuditLog() {
    try {
      setLoading(true);
      let query = supabase
        .from('group_audit_log')
        .select(`
          *,
          user:user_id(id, email, full_name)
        `)
        .eq('group_id', groupId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (filters.action && filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }
      if (filters.entityType && filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load audit log',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function getActionColor(action: string): string {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'delete':
        return 'bg-red-500';
      case 'invite':
        return 'bg-purple-500';
      case 'join':
        return 'bg-teal-500';
      case 'leave':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  }

  function formatChanges(oldValues: any, newValues: any) {
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);

    allKeys.forEach(key => {
      const oldValue = oldValues?.[key];
      const newValue = newValues?.[key];

      if (oldValue !== newValue) {
        if (oldValue === undefined) {
          changes.push(`Added ${key}: ${JSON.stringify(newValue)}`);
        } else if (newValue === undefined) {
          changes.push(`Removed ${key}`);
        } else {
          changes.push(`Changed ${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
        }
      }
    });

    return changes;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        {!limit && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, action: value }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="invite">Invite</SelectItem>
                  <SelectItem value="join">Join</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.entityType}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, entityType: value }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="setting">Setting</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, userId: e.target.value }))
                }
                className="w-[200px]"
              />
            </div>
          </div>
        )}

        <ScrollArea className={limit ? 'h-full' : 'h-[500px]'}>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading audit log...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No audit log entries found
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action}
                      </Badge>
                      <Badge variant="outline">{entry.entity_type}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm">
                      <span className="font-medium">
                        {entry.user?.full_name || 'Unknown User'}
                      </span>{' '}
                      ({entry.user?.email})
                    </p>
                  </div>

                  {(entry.old_values || entry.new_values) && (
                    <div className="text-sm space-y-1">
                      {formatChanges(entry.old_values, entry.new_values).map(
                        (change, i) => (
                          <p key={i} className="text-muted-foreground">
                            {change}
                          </p>
                        )
                      )}
                    </div>
                  )}

                  {entry.metadata && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Additional Info:{' '}
                        {typeof entry.metadata === 'string'
                          ? entry.metadata
                          : JSON.stringify(entry.metadata)}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p>IP: {entry.ip_address}</p>
                    <p className="truncate">User Agent: {entry.user_agent}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 