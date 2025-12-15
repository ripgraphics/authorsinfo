'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';

interface Props {
  listId: string;
  groupId: string;
  onClose: () => void;
  onBookAdded: () => void;
}

export default function AddBookModal({ listId, groupId, onClose, onBookAdded }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('title', `%${searchQuery}%`)
      .limit(10);

    if (error) {
      toast.error('Failed to search books');
    } else {
      setSearchResults(data || []);
    }
    setIsSearching(false);
  };

  const handleAddBook = async (bookId: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      toast.error('Please sign in to add books');
      return;
    }

    const { error } = await (supabase.from('group_book_list_items') as any).insert([
      {
        list_id: listId,
        book_id: bookId,
        group_id: groupId,
        added_by: userId,
      },
    ]);

    if (error) {
      toast.error('Failed to add book to list');
    } else {
      toast.success('Book added to list!');
      onBookAdded();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Book to List</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a book..."
              className="flex-1 p-2 border rounded"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {searchResults.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between p-3 border-b last:border-b-0"
            >
              <div className="flex items-center gap-4">
                {book.cover_image_id && (
                  <img
                    src={`/api/books/cover/${book.cover_image_id}`}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-medium">{book.title}</h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddBook(book.id)}
                className="bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 