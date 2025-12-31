import type { Metadata } from 'next'
import {
  getBookGenres,
  addBookGenre,
  updateBookGenre,
  deleteBookGenre,
} from '@/app/actions/admin-tables'
import { TableEditor } from '@/components/admin/table-editor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Book Genres Management | Author's Info Admin",
  description: 'Manage book genres for the application',
}

export default async function BookGenresPage() {
  const bookGenres = await getBookGenres()

  return (
    <div className="p-6 space-y-6">
      <TableEditor
        title="Book Genre"
        items={bookGenres}
        onAdd={addBookGenre}
        onUpdate={updateBookGenre}
        onDelete={deleteBookGenre}
        hasDescription={true}
      />
    </div>
  )
}
