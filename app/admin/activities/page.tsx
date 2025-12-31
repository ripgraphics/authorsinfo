import { PageContainer } from '@/components/page-container'
import { GenerateActivitiesForm } from './generate-form'
import { TableInfo } from './table-info'

export default function AdminActivitiesPage() {
  // No auth check - allowing direct access to the activity generator

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Activity Generation</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Entity Timeline Activities</h2>
          <p className="mb-4">
            Generate activities for authors, books, publishers, users and groups in the database.
            This is useful for:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Populating timelines for profile pages</li>
            <li>Creating activity history for newly added entities</li>
            <li>Ensuring all records have associated activities</li>
            <li>Backfilling activity data</li>
          </ul>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-6">
            <h3 className="font-medium text-amber-800 mb-1">How it works</h3>
            <p className="text-amber-700 text-sm">
              This tool will generate appropriate activities for entities in the database. New
              records will automatically have activities created via database triggers. Use this
              tool to generate activities for existing data or if you need to regenerate activities.
            </p>
          </div>

          <GenerateActivitiesForm />

          <TableInfo />
        </div>
      </div>
    </PageContainer>
  )
}
