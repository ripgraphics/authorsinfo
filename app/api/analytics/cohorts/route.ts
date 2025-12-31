// app/api/analytics/cohorts/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  experimental_taintObjectReference,
  experimental_taintUniqueValue,
} from 'react';

export const dynamic = 'force-dynamic';

// GET handler for fetching cohort analysis data from the materialized view
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

    // The createClient from lib/supabase/server uses the service role key,
    // which bypasses RLS. For analytics routes like this, where we want
    // admin-level access to aggregated data, this is often intended.
    // We'll add a manual role check here for security.

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
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view analytics.' }, { status: 403 });
    }

    // Query the materialized view for the cohort summary
    const { data: cohortData, error: queryError } = await supabase
      .from('mv_cohort_retention_summary')
      .select('*')
      .order('cohort_id', { ascending: false });

    if (queryError) {
      console.error('Error fetching cohort data from materialized view:', queryError);
      return NextResponse.json({ error: 'Failed to fetch cohort data' }, { status: 500 });
    }

    return NextResponse.json(cohortData);

  } catch (error) {
    console.error('An unexpected error occurred in cohorts GET route:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
