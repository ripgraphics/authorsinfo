import { createClient } from '@/lib/supabase-server';
import AdminEventsBulkUI from './client'

export default async function AdminEventsPage({ searchParams }: { searchParams?: Promise<{ status?: string, search?: string, creator?: string, page?: string }> }) {
  const params = await (searchParams || Promise.resolve({}))
  // Pagination
  const page = parseInt(params?.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch all events, including drafts and pending approval
  const supabase = createClient();
  const status = params?.status || '';
  const search = params?.search || '';
  const creator = params?.creator || '';
  let query = supabase
    .from('events')
    .select(`*, category:event_categories(*), created_by, status`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (creator) {
    query = query.eq('created_by', creator);
  }
  const { data: events, error, count: totalCount } = await query;

  // Get unique creators for filter and user info
  const creators = Array.from(new Set((events || []).map((e: any) => e.created_by))).filter(Boolean);
  let userMap: Record<string, { id: string, name: string, email: string, created_at: string }> = {};
  if (creators.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .in('id', creators);
    if (users) {
      userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));
    }
  }

  // Bulk actions and selection state will be handled in a client component
  return <AdminEventsBulkUI events={events || []} creators={creators} status={status} search={search} creator={creator} page={page} limit={limit} totalCount={totalCount || 0} userMap={userMap} />;
}
