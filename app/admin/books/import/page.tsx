import { redirect } from 'next/navigation'

export default function AdminBooksImportPage() {
  // Redirect to the existing books import page
  redirect('/books/import')
}
