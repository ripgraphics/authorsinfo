import { createClient } from '@/lib/supabase-server';
import BookListsClient from './BookListsClient';

export default async function GroupBookListsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Fetch initial book lists
  const { data: bookLists } = await supabase
    .from('group_book_lists')
    .select(`
      *,
      group_book_list_items (
        *,
        books (
          id,
          title,
          author,
          cover_image_id
        )
      )
    `)
    .eq('group_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Group Book Lists</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => {/* Will be handled by client component */}}
        >
          Create New List
        </button>
      </div>
      
      <BookListsClient 
        initialBookLists={bookLists || []} 
        groupId={params.id}
      />
    </div>
  );
} 