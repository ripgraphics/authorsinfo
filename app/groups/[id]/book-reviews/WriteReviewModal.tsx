import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export default function WriteReviewModal({ isOpen, onClose, groupId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [reviewDetails, setReviewDetails] = useState({
    rating: 0,
    review: '',
    contains_spoilers: false
  });
  const supabase = createClient();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_image_id, average_rating, review_count')
      .ilike('title', `%${searchQuery}%`)
      .limit(10);

    if (error) {
      toast.error('Failed to search books');
      return;
    }

    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleSubmitReview = async () => {
    if (!selectedBook || !reviewDetails.rating || !reviewDetails.review) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { error } = await (supabase
      .from('book_reviews') as any)
      .insert([{
        group_id: groupId,
        book_id: selectedBook.id,
        rating: reviewDetails.rating,
        content: reviewDetails.review,
        contains_spoilers: reviewDetails.contains_spoilers,
        visibility: 'public'
      }]);

    if (error) {
      toast.error('Failed to submit review');
      return;
    }

    toast.success('Review submitted successfully');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Write a Book Review</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Book Search */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Book</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a book..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedBook?.id === book.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="flex items-center gap-3">
                    {book.cover_image_id && (
                      <img
                        src={`/api/images/${book.cover_image_id}`}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold">{book.title}</h4>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Review Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewDetails(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= reviewDetails.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                <textarea
                  value={reviewDetails.review}
                  onChange={(e) => setReviewDetails(prev => ({ ...prev, review: e.target.value }))}
                  placeholder="Write your review..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="contains_spoilers"
                  checked={reviewDetails.contains_spoilers}
                  onChange={(e) => setReviewDetails(prev => ({ ...prev, contains_spoilers: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="contains_spoilers" className="ml-2 block text-sm text-gray-700">
                  This review contains spoilers
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 