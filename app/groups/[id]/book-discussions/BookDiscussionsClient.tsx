import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';
import StartDiscussionModal from './StartDiscussionModal';

interface Book {
  id: number;
  title: string;
  author: string;
  cover_image_id: string | null;
  average_rating: number;
  review_count: number;
}

interface User {
  id: string;
  name: string;
}

interface Participant {
  user_id: string;
  role: 'participant' | 'moderator';
  last_read_at: string;
}

interface BookDiscussion {
  id: string;
  group_id: string;
  book_id: number;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'closed';
  is_pinned: boolean;
  last_activity_at: string;
  books: Book;
  users: User;
  book_discussion_participants: Participant[];
}

interface Props {
  initialDiscussions: BookDiscussion[];
  groupId: string;
}

export default function BookDiscussionsClient({ initialDiscussions, groupId }: Props) {
  const [discussions, setDiscussions] = useState<BookDiscussion[]>(initialDiscussions);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('book_discussions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_discussions',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDiscussions(prev => [payload.new as BookDiscussion, ...prev]);
            toast.success('New discussion started!');
          } else if (payload.eventType === 'DELETE') {
            setDiscussions(prev => prev.filter(discussion => discussion.id !== payload.old.id));
            toast.success('Discussion removed');
          } else if (payload.eventType === 'UPDATE') {
            setDiscussions(prev => 
              prev.map(discussion => 
                discussion.id === payload.new.id ? payload.new as BookDiscussion : discussion
              )
            );
            toast.success('Discussion updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const handleDeleteDiscussion = async (discussionId: string) => {
    const { error } = await supabase
      .from('book_discussions')
      .delete()
      .eq('id', discussionId);

    if (error) {
      toast.error('Failed to delete discussion');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6">
        {discussions.map((discussion) => (
          <div
            key={discussion.id}
            className={`bg-white rounded-lg shadow-md p-6 border ${
              discussion.is_pinned ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                {discussion.books.cover_image_id && (
                  <img
                    src={`/api/images/${discussion.books.cover_image_id}`}
                    alt={discussion.books.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-sm"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{discussion.title}</h3>
                  <p className="text-gray-600">Book: {discussion.books.title}</p>
                  <p className="text-gray-600">by {discussion.books.author}</p>
                  {discussion.description && (
                    <p className="mt-2 text-gray-700">{discussion.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Started by {discussion.users.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(discussion.created_at)}
                </p>
                <p className="text-sm text-gray-500">
                  Last activity: {formatDate(discussion.last_activity_at)}
                </p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    discussion.status === 'active' ? 'bg-green-100 text-green-800' :
                    discussion.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {discussion.status.charAt(0).toUpperCase() + discussion.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {discussion.book_discussion_participants.length} participants
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {/* Navigate to discussion */}}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Discussion
                </button>
                <button
                  onClick={() => handleDeleteDiscussion(discussion.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <StartDiscussionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        groupId={groupId}
      />
    </div>
  );
} 