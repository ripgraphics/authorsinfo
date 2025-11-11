import { createClient } from '@/lib/supabase-server';
import AuthorEventsClient from './AuthorEventsClient';

export default async function AuthorEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  
  // Fetch initial author events
  const { data: authorEvents } = await supabase
    .from('group_author_events')
    .select(`
      *,
      events (
        id,
        title,
        description,
        start_date,
        end_date,
        format,
        status,
        virtual_meeting_url,
        cover_image_id
      ),
      authors (
        id,
        name,
        bio,
        author_image_id
      )
    `)
    .eq('group_id', id)
    .order('scheduled_at', { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Author Events</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {/* Will be handled by client component */}}
        >
          Schedule Event
        </button>
      </div>
      
      <AuthorEventsClient 
        initialAuthorEvents={authorEvents || []} 
        groupId={id}
      />
    </div>
  );
} 