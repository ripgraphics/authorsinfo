import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';
import WriteReviewModal from './WriteReviewModal';

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

interface Group {
  id: string;
  name: string;
}

interface BookReview {
  id: string;
  group_id: string | null;
  book_id: number;
  user_id: string;
  rating: number;
  review: string;
  created_at: string;
  visibility: 'public' | 'private';
  books: Book;
  users: User;
  groups: Group | null;
}

interface Props {
  initialBookReviews: BookReview[];
  groupId: string;
}

export default function BookReviewsClient({ initialBookReviews, groupId }: Props) {
  const [bookReviews, setBookReviews] = useState<BookReview[]>(initialBookReviews);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('book_reviews_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_reviews',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookReviews(prev => [payload.new as BookReview, ...prev]);
            toast.success('New book review added!');
          } else if (payload.eventType === 'DELETE') {
            setBookReviews(prev => prev.filter(review => review.id !== payload.old.id));
            toast.success('Book review removed');
          } else if (payload.eventType === 'UPDATE') {
            setBookReviews(prev => 
              prev.map(review => 
                review.id === payload.new.id ? payload.new as BookReview : review
              )
            );
            toast.success('Book review updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('book_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      toast.error('Failed to delete review');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6">
        {bookReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                {review.books.cover_image_id && (
                  <img
                    src={`/api/images/${review.books.cover_image_id}`}
                    alt={review.books.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-sm"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{review.books.title}</h3>
                  <p className="text-gray-600">by {review.books.author}</p>
                  <div className="mt-2">
                    {renderStars(review.rating)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Reviewed by {review.users.name}
                </p>
                {review.groups && (
                  <p className="text-sm text-blue-600">
                    From {review.groups.name}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {formatDate(review.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-700 whitespace-pre-wrap">{review.review}</p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleDeleteReview(review.id)}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                Delete Review
              </button>
            </div>
          </div>
        ))}
      </div>

      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        groupId={groupId}
      />
    </div>
  );
} 