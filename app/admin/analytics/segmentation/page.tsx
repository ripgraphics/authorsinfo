import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserSegmentationDashboard from '@/components/analytics/segmentation-dashboard';

export const metadata = {
  title: 'User Segmentation | Admin Analytics',
  description: 'Analyze user segments and cohort distributions',
};

export default async function UserSegmentationPage() {
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
            // This can be ignored if you have middleware refreshing
            // user sessions.
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-4 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Segmentation</h1>
            <p className="mt-2 text-muted-foreground">
              Analyze and visualize user segments based on behavioral, demographic, engagement, and activity criteria.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-4 lg:px-8">
        <UserSegmentationDashboard />
      </div>
    </div>
  );
}
