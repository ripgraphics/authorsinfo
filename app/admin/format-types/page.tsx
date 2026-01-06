import type { Metadata } from 'next'
import {
  getFormatTypes,
  addFormatType,
  updateFormatType,
  deleteFormatType,
} from '@/app/actions/admin-tables'
import { TableEditor } from '@/components/admin/table-editor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Format Types Management | Author's Info Admin",
  description: 'Manage format types for the application',
}

export default async function FormatTypesPage() {
  const formatTypes = await getFormatTypes()

  return (
    <div className="p-4 space-y-6">
      <TableEditor
        title="Format Type"
        items={formatTypes}
        onAdd={addFormatType}
        onUpdate={updateFormatType}
        onDelete={deleteFormatType}
        hasDescription={true}
      />
    </div>
  )
}
