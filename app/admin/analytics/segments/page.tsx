import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SegmentationDashboard } from '@/components/segmentation-dashboard';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';

export default async function SegmentationPage() {
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
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    redirect('/');
  }

  return (
    <PageContainer>
      <PageHeader 
        title="User Segmentation" 
        description="Advanced user segmentation and behavioral analysis"
      />
      <SegmentationDashboard />
    </PageContainer>
  );
}
