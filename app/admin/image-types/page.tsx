import type { Metadata } from 'next'
import {
  getImageTypes,
  addImageType,
  updateImageType,
  deleteImageType,
} from '@/app/actions/admin-tables'
import { TableEditor } from '@/components/admin/table-editor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Image Types Management | Author's Info Admin",
  description: 'Manage image types for the application',
}

export default async function ImageTypesPage() {
  const imageTypes = await getImageTypes()

  return (
    <div className="p-6 space-y-6">
      <TableEditor
        title="Image Type"
        items={imageTypes}
        onAdd={addImageType}
        onUpdate={updateImageType}
        onDelete={deleteImageType}
        hasDescription={true}
      />
    </div>
  )
}
