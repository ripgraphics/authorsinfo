import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  experimental_taintObjectReference,
  experimental_taintUniqueValue,
} from 'react';

export const dynamic = 'force-dynamic';

// Interface for segmentation data returned from the API
interface SegmentData {
  id: number;
  name: string;
  description: string;
  segment_type: 'behavioral' | 'demographic' | 'engagement' | 'activity';
  criteria: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  member_count: number;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const supabase = createClient();
    experimental_taintObjectReference(
      'Do not pass the Supabase client to the client.',
      supabase,
    );
    experimental_taintUniqueValue(
      'Do not pass the Supabase client to the client.',
      supabase,
      "supabase"
    );

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view analytics.' },
        { status: 403 }
      );
    }

    // Fetch all active segments with member counts
    const { data: segments, error: segmentError } = await supabase
      .from('user_segments')
      .select('*')
      .eq('status', 'active')
      .order('member_count', { ascending: false });

    if (segmentError) {
      console.error('Error fetching segments:', segmentError);
      return NextResponse.json(
        { error: 'Failed to fetch segmentation data' },
        { status: 500 }
      );
    }

    // If no segments exist, return empty array
    if (!segments || segments.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(segments as SegmentData[]);

  } catch (error) {
    console.error('An unexpected error occurred in segmentation GET route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
