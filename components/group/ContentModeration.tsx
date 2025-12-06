'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface ContentModerationProps {
  groupId: string;
  userRole: string;
}

interface ModerationItem {
  id: string;
  content_type: string;
  content_id: string;
  reporter_id: string;
  moderator_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reason: string;
  ai_score: number;
  ai_flags: any;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export default function ContentModeration({ groupId, userRole }: ContentModerationProps) {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [contentDetails, setContentDetails] = useState<any>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchModerationItems();
  }, [selectedStatus]);

  async function fetchModerationItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_content_moderation')
        .select(`
          *,
          reporter:reporter_id(id, email, full_name),
          moderator:moderator_id(id, email, full_name)
        `)
        .eq('group_id', groupId)
        .eq('status', selectedStatus)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);

      // Fetch content details for each item
      for (const item of data || []) {
        await fetchContentDetails(item);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load moderation queue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchContentDetails(item: ModerationItem) {
    try {
      const { data, error } = await supabase
        .from(item.content_type)
        .select('*')
        .eq('id', item.content_id)
        .single();

      if (error) throw error;
      setContentDetails((prev: any) => ({
        ...prev,
        [item.content_id]: data,
      }));
    } catch (err) {
      console.error('Error fetching content details:', err);
    }
  }

  async function handleModeration(item: ModerationItem, newStatus: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('group_content_moderation')
        .update({
          status: newStatus,
          moderator_id: supabase.auth.getUser(),
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Content has been ${newStatus}`,
      });

      // Refresh the list
      fetchModerationItems();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update content status',
        variant: 'destructive',
      });
    }
  }

  function renderAIFlags(flags: any) {
    if (!flags) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium">AI Analysis</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(flags).map(([key, value]: [string, any]) => (
            <Badge
              key={key}
              variant={value > 0.7 ? 'destructive' : 'secondary'}
            >
              {key}: {(value * 100).toFixed(1)}%
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  function renderContentPreview(item: ModerationItem) {
    const content = contentDetails?.[item.content_id];
    if (!content) return null;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium">Content Preview</h4>
          <p className="text-sm text-muted-foreground">
            Type: {item.content_type}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          {/* Render content based on type */}
          {item.content_type === 'posts' && (
            <>
              <h3 className="font-medium">{content.title}</h3>
              <p className="mt-2">{content.content}</p>
            </>
          )}
          {item.content_type === 'comments' && (
            <p>{content.content}</p>
          )}
          {item.content_type === 'images' && (
            <div>
              <img
                src={content.url}
                alt="Content"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="flagged">Flagged</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {loading ? (
                <div className="text-center py-8">Loading moderation queue...</div>
              ) : items.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No {selectedStatus} content to review.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ScrollArea className="h-[600px] border rounded-lg p-4">
                    <div className="space-y-4">
                      {items.map((item) => (
                        <Card
                          key={item.id}
                          className={`cursor-pointer transition-colors ${
                            selectedItem?.id === item.id
                              ? 'border-primary'
                              : 'hover:border-muted'
                          }`}
                          onClick={() => setSelectedItem(item)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <Badge>{item.content_type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="font-medium">Reason: {item.reason}</p>
                              <p className="text-sm text-muted-foreground">
                                Reporter: {(item as any).reporter?.full_name || 'Anonymous'}
                              </p>
                            </div>
                            {item.ai_score && (
                              <div className="mt-2">
                                <Badge
                                  variant={
                                    item.ai_score > 0.7
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  AI Score: {(item.ai_score * 100).toFixed(1)}%
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="space-y-6">
                    {selectedItem ? (
                      <>
                        {renderContentPreview(selectedItem)}
                        {renderAIFlags(selectedItem.ai_flags)}

                        {selectedItem.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() =>
                                handleModeration(selectedItem, 'approved')
                              }
                              className="flex-1"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                handleModeration(selectedItem, 'rejected')
                              }
                              variant="destructive"
                              className="flex-1"
                            >
                              Reject
                            </Button>
                            <Button
                              onClick={() =>
                                handleModeration(selectedItem, 'flagged')
                              }
                              variant="outline"
                              className="flex-1"
                            >
                              Flag for Review
                            </Button>
                          </div>
                        )}

                        {selectedItem.resolution_notes && (
                          <div className="mt-4">
                            <h4 className="font-medium">Resolution Notes</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedItem.resolution_notes}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select an item to review
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 