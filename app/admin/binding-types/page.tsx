import type { Metadata } from 'next'
import {
  getBindingTypes,
  addBindingType,
  updateBindingType,
  deleteBindingType,
} from '@/app/actions/admin-tables'
import { TableEditor } from '@/components/admin/table-editor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Binding Types Management | Author's Info Admin",
  description: 'Manage binding types for the application',
}

export default async function BindingTypesPage() {
  const bindingTypes = await getBindingTypes()

  return (
    <div className="p-6 space-y-6">
      <TableEditor
        title="Binding Type"
        items={bindingTypes}
        onAdd={addBindingType}
        onUpdate={updateBindingType}
        onDelete={deleteBindingType}
        hasDescription={true}
      />
    </div>
  )
}
