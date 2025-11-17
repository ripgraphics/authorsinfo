import { getTableColumns } from "@/app/actions/inspect-schema"

export default async function InspectSchemaPage() {
  const { columns, error } = await getTableColumns("books")

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error Inspecting Schema</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      </div>
    )
  }

  // Filter for ISBN-related columns
  const isbnColumns = columns.filter((col: { column_name: string }) => col.column_name.toLowerCase().includes("isbn"))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Books Table Schema</h1>

      <h2 className="text-xl font-semibold mt-6 mb-2">ISBN-Related Columns</h2>
      {isbnColumns.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Column Name</th>
                <th className="py-2 px-4 border-b text-left">Data Type</th>
                <th className="py-2 px-4 border-b text-left">Nullable</th>
              </tr>
            </thead>
            <tbody>
              {isbnColumns.map((column) => (
                <tr key={column.column_name} className="border-b">
                  <td className="py-2 px-4">{column.column_name}</td>
                  <td className="py-2 px-4">{column.data_type}</td>
                  <td className="py-2 px-4">{column.is_nullable === "YES" ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-amber-600">No ISBN-related columns found in the books table.</p>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">All Columns</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Column Name</th>
              <th className="py-2 px-4 border-b text-left">Data Type</th>
              <th className="py-2 px-4 border-b text-left">Nullable</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.column_name} className="border-b">
                <td className="py-2 px-4">{column.column_name}</td>
                <td className="py-2 px-4">{column.data_type}</td>
                <td className="py-2 px-4">{column.is_nullable === "YES" ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
