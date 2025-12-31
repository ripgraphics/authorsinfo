'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserSegment, 
  SegmentMember, 
  SegmentsListResponse, 
  SegmentResponse, 
  SegmentMembersResponse,
  CreateSegmentPayload,
  UpdateSegmentPayload,
  AddSegmentMemberPayload
} from '@/types/analytics';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabase-client';

export function useSegmentation() {
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSegments = useCallback(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/segments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result: SegmentsListResponse = await response.json();
      
      if (result.success) {
        setSegments(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch segments');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createSegment = async (payload: CreateSegmentPayload) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/analytics/segments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });
      const result: SegmentResponse = await response.json();

      if (result.success && result.data) {
        setSegments(prev => [result.data!, ...prev]);
        toast({
          title: 'Success',
          description: 'Segment created successfully',
        });
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create segment');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSegment = async (id: number, payload: UpdateSegmentPayload) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) return;

    try {
      const response = await fetch(`/api/analytics/segments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });
      const result: SegmentResponse = await response.json();

      if (result.success && result.data) {
        setSegments(prev => prev.map(s => s.id === id ? result.data! : s));
        toast({
          title: 'Success',
          description: 'Segment updated successfully',
        });
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update segment');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSegment = async (id: number) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) return;

    try {
      const response = await fetch(`/api/analytics/segments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setSegments(prev => prev.filter(s => s.id !== id));
        toast({
          title: 'Success',
          description: 'Segment deleted successfully',
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete segment');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const fetchSegmentMembers = async (id: number) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) return [];

    try {
      const response = await fetch(`/api/analytics/segments/${id}/members`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result: SegmentMembersResponse = await response.json();

      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to fetch members');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return {
    segments,
    isLoading,
    error,
    refreshSegments: fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    fetchSegmentMembers
  };
}
