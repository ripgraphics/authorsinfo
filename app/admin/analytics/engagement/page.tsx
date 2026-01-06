import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EngagementMetricsSection from '@/components/analytics/engagement-metrics-section';
import EngagementHeatmap from '@/components/analytics/engagement-heatmap';
import TrendingTopicsTable from '@/components/analytics/trending-topics-table';

export const metadata = {
  title: 'Engagement Trends & Analytics | Admin Analytics',
  description: 'Analyze engagement trends, heatmaps, and trending topics',
};

export default async function EngagementAnalyticsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-4 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Engagement Trends & Analytics</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor user engagement patterns, trending topics, and activity distribution across the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-4 lg:px-8">
        <div className="space-y-8">
          {/* Engagement Metrics */}
          <section>
            <EngagementMetricsSection />
          </section>

          {/* Engagement Heatmap */}
          <section>
            <EngagementHeatmap />
          </section>

          {/* Trending Topics */}
          <section>
            <TrendingTopicsTable />
          </section>
        </div>
      </div>
    </div>
  );
}
