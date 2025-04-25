'use server'

import { bulkImportBooks } from '@/app/actions/bulk-import-books';

export async function addBooks(formData: FormData) {
  const isbns = JSON.parse(formData.get('isbns') as string);
  await bulkImportBooks(isbns);
} 