import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminAnalyticsDashboard } from './client';

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8">
      <AdminAnalyticsDashboard userId={user.id} />
    </div>
  );
}
