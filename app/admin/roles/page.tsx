import type { Metadata } from 'next'
import { getRoles, addRole, updateRole, deleteRole } from '@/app/actions/admin-tables'
import { TableEditor } from '@/components/admin/table-editor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Roles Management | Author's Info Admin",
  description: 'Manage roles for the application',
}

export default async function RolesPage() {
  const roles = await getRoles()

  return (
    <div className="p-6 space-y-6">
      <TableEditor
        title="Role"
        items={roles}
        onAdd={addRole}
        onUpdate={updateRole}
        onDelete={deleteRole}
        hasDescription={true}
      />
    </div>
  )
}
