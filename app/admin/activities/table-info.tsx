"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader } from "lucide-react"

export function TableInfo() {
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchTableInfo() {
      try {
        // Get activities table columns
        const { data, error } = await supabase.rpc('get_table_columns', { 
          table_name_param: 'activities' 
        })
        
        if (error) {
          throw error
        }
        
        setTableInfo(data)
      } catch (err: any) {
        console.error("Error fetching table info:", err)
        setError(err.message || "Failed to fetch table information")
        
        // Fallback to manual query
        try {
          const { data, error } = await supabase.from('activities')
            .select('*')
            .limit(1)
          
          if (error) throw error
          
          // If we get data, extract the keys
          if (data && data.length > 0) {
            setTableInfo(Object.keys(data[0]).map(key => ({
              column_name: key,
              data_type: typeof data[0][key],
              is_nullable: "unknown"
            })))
          }
        } catch (e) {
          console.error("Fallback also failed:", e)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTableInfo()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader className="h-4 w-4 animate-spin" />
        <span>Loading table information...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="font-medium text-red-800 mb-1">Error fetching table information</h3>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Activities Table Structure</h3>
      
      {tableInfo && tableInfo.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableInfo.map((column: any, index: number) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{column.column_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{column.data_type}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{column.is_nullable === "YES" ? "Yes" : (column.is_nullable === "NO" ? "No" : column.is_nullable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground">No column information available</p>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-800 mb-1">Usage Notes</h4>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>The activity generator has been updated to only use columns that exist in the schema</li>
          <li>If you see schema errors, check which columns are available above</li>
          <li>Entity IDs that don't have dedicated columns are stored in the data JSON field</li>
        </ul>
      </div>
    </div>
  )
} 