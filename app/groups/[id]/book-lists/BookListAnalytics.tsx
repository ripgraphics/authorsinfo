'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';

interface Props {
  listId: string;
  groupId: string;
}

interface Analytics {
  totalVotes: number;
  mostVotedBook: {
    title: string;
    votes: number;
  } | null;
  totalBooks: number;
  recentActivity: {
    type: 'vote' | 'add' | 'remove';
    bookTitle: string;
    userName: string;
    timestamp: string;
  }[];
}

export default function BookListAnalytics({ listId, groupId }: Props) {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalVotes: 0,
    mostVotedBook: null,
    totalBooks: 0,
    recentActivity: [],
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Fetch votes data
      const { data: votesData } = await supabase
        .from('group_book_list_votes')
        .select('*')
        .eq('list_id', listId);

      // Fetch books data
      const { data: booksData } = await supabase
        .from('group_book_list_items')
        .select(`
          *,
          books (
            title
          )
        `)
        .eq('list_id', listId);

      // Calculate analytics
      const totalVotes = votesData?.length || 0;
      const bookVotes = votesData?.reduce((acc: any, vote: any) => {
        acc[vote.book_id] = (acc[vote.book_id] || 0) + 1;
        return acc;
      }, {});

      const mostVotedBookId = Object.entries(bookVotes || {}).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      const mostVotedBook = mostVotedBookId
        ? {
            title: (booksData?.find((b: any) => b.book_id === mostVotedBookId[0]) as any)?.books?.title || '',
            votes: mostVotedBookId[1] as number,
          }
        : null;

      setAnalytics({
        totalVotes,
        mostVotedBook,
        totalBooks: booksData?.length || 0,
        recentActivity: [], // Will be populated by real-time updates
      });
    };

    fetchAnalytics();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('book_list_analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_book_list_votes',
          filter: `list_id=eq.${listId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', payload.new.user_id)
              .single();

            const { data: bookData } = await supabase
              .from('books')
              .select('title')
              .eq('id', payload.new.book_id)
              .single();

            setAnalytics((prev) => ({
              ...prev,
              totalVotes: prev.totalVotes + 1,
              recentActivity: [
                {
                  type: 'vote',
                  bookTitle: (bookData as any)?.title || '',
                  userName: (userData as any)?.name || 'Anonymous',
                  timestamp: new Date().toISOString(),
                },
                ...prev.recentActivity.slice(0, 9),
              ],
            }));

            toast.success(`${(userData as any)?.name || 'Someone'} voted for ${(bookData as any)?.title || 'a book'}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">List Analytics</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Votes</h3>
          <p className="text-2xl font-bold">{analytics.totalVotes}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Total Books</h3>
          <p className="text-2xl font-bold">{analytics.totalBooks}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Most Voted Book</h3>
          <p className="text-lg font-bold truncate">
            {analytics.mostVotedBook?.title || 'No votes yet'}
          </p>
          {analytics.mostVotedBook && (
            <p className="text-sm text-purple-600">
              {analytics.mostVotedBook.votes} votes
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {analytics.recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>
                {activity.userName} {activity.type === 'vote' ? 'voted for' : 'added'} {activity.bookTitle}
              </span>
              <span className="text-gray-400">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {analytics.recentActivity.length === 0 && (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
} 