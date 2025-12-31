import { Metadata } from 'next';
import { AnalyticsDashboardClient } from '@/components/analytics-dashboard-client';
import { createClient } from '@/lib/supabase/server';
import type { CohortRetentionView, UserChurnRisk, UserSegment, EngagementHeatmap, TrendingTopic } from '@/types/analytics';

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'Advanced analytics and insights into user behavior and platform health',
};

async function getAnalyticsData() {
  const supabase = await createClient();

  try {
    const [cohortsResult, churnResult, segmentsResult, engagementResult, topicsResult] = await Promise.all([
      supabase
        .from('cohort_retention_view')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(50),
      supabase
        .from('user_churn_risk')
        .select('*')
        .order('risk_score', { ascending: false })
        .limit(100),
      supabase
        .from('user_segments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('daily_engagement_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(168),
      supabase
        .from('trending_topics')
        .select('*')
        .order('mention_count', { ascending: false })
        .limit(50),
    ]);

    return {
      cohorts: (cohortsResult.data as CohortRetentionView[]) || [],
      churnUsers: (churnResult.data as UserChurnRisk[]) || [],
      segments: (segmentsResult.data as UserSegment[]) || [],
      engagementData: (engagementResult.data as EngagementHeatmap[]) || [],
      trendingTopics: (topicsResult.data as TrendingTopic[]) || [],
      error: cohortsResult.error || churnResult.error || segmentsResult.error || engagementResult.error || topicsResult.error,
    };
  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    return {
      cohorts: [],
      churnUsers: [],
      segments: [],
      engagementData: [],
      trendingTopics: [],
      error,
    };
  }
}

export default async function AnalyticsPage() {
  const { cohorts, churnUsers, segments, engagementData, trendingTopics } = await getAnalyticsData();

  return (
    <main className="min-h-screen bg-slate-950">
      <AnalyticsDashboardClient
        initialTab="cohorts"
        cohorts={cohorts}
        churnUsers={churnUsers}
        segments={segments}
        engagementData={engagementData}
        trendingTopics={trendingTopics}
        isLoading={false}
      />
    </main>
  );
}
