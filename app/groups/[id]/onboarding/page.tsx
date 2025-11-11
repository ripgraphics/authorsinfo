import { createClient } from '@/lib/supabase-server';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  // Fetch welcome messages
  const { data: messages } = await supabase
    .from('group_welcome_messages')
    .select(`
      *,
      group_roles (
        id,
        name
      )
    `)
    .eq('group_id', id)
    .order('created_at', { ascending: true });

  // Fetch checklists
  const { data: checklists } = await supabase
    .from('group_onboarding_checklists')
    .select(`
      *,
      group_onboarding_tasks (
        id,
        task,
        order_index
      )
    `)
    .eq('group_id', id)
    .order('created_at', { ascending: true });

  return (
    <OnboardingClient
      groupId={id}
      welcomeMessages={messages || []}
      checklists={checklists || []}
    />
  );
} 