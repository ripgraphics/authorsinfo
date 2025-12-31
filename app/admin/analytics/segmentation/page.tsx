import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserSegmentationDashboard from '@/components/analytics/segmentation-dashboard';

export const metadata = {
  title: 'User Segmentation | Admin Analytics',
  description: 'Analyze user segments and cohort distributions',
};

export default async function UserSegmentationPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Segmentation</h1>
            <p className="mt-2 text-muted-foreground">
              Analyze and visualize user segments based on behavioral, demographic, engagement, and activity criteria.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <UserSegmentationDashboard />
      </div>
    </div>
  );
}
