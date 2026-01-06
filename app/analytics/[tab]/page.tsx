import { Metadata } from 'next';
import { AnalyticsDashboardClient } from '@/components/analytics-dashboard-client';
import { createClient } from '@/lib/supabase/server';
import type { CohortRetentionView, UserChurnRisk, UserSegment, EngagementHeatmap, TrendingTopic } from '@/types/analytics';

interface PageProps {
  params: {
    tab: 'cohorts' | 'churn' | 'segments' | 'engagement';
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tabLabels: Record<string, string> = {
    cohorts: 'Cohort Analysis',
    churn: 'Churn Risk Analysis',
    segments: 'User Segmentation',
    engagement: 'Engagement Analytics',
  };

  return {
    title: `Analytics - ${tabLabels[params.tab] || 'Dashboard'}`,
    description: `View detailed ${tabLabels[params.tab] || 'analytics'} and insights`,
  };
}

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
    };
  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    return {
      cohorts: [],
      churnUsers: [],
      segments: [],
      engagementData: [],
      trendingTopics: [],
    };
  }
}

export default async function AnalyticsTabPage({ params }: PageProps) {
  const { cohorts, churnUsers, segments, engagementData, trendingTopics } = await getAnalyticsData();

  const isValidTab = ['cohorts', 'churn', 'segments', 'engagement'].includes(params.tab);

  if (!isValidTab) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Tab Not Found</h1>
          <p className="text-slate-400 mb-6">The analytics tab you requested does not exist.</p>
          <a
            href="/analytics"
            className="inline-block px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Analytics
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <AnalyticsDashboardClient
        initialTab={params.tab}
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
