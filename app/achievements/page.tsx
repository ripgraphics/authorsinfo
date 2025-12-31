/**
 * Gamification Dashboard Page
 * Displays badges, achievements, and leaderboards
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerComponentClientAsync } from '@/lib/supabase/client-helper';
import { GamificationDashboardClient } from './gamification-dashboard-client';

export const metadata: Metadata = {
  title: 'Achievements & Leaderboards | Reading Community',
  description: 'View your badges, achievements, and see how you rank against other readers',
};

export default async function GamificationPage() {
  const supabase = await createServerComponentClientAsync();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <GamificationDashboardClient userId={user.id} />;
}
