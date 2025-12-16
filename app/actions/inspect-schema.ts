"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

export async function getTableColumns(tableName: string) {
  try {
    // PostgREST doesn't allow querying information_schema directly
    // Instead, get a sample row to determine column names
    const { data: sampleRow, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(`Error fetching columns for table ${tableName}:`, error)
      return { columns: [], error: error.message }
    }

    if (!sampleRow) {
      // Table might be empty, try to infer from a type-safe query
      // Return empty columns if no data exists
      return { columns: [], error: null }
    }

    // Extract column names and types from the sample row
    const columns = Object.keys(sampleRow).map((columnName) => ({
      column_name: columnName,
      data_type: typeof sampleRow[columnName],
      is_nullable: sampleRow[columnName] === null ? 'YES' : 'NO'
    }))

    return { columns, error: null }
  } catch (error) {
    console.error(`Error in getTableColumns for ${tableName}:`, error)
    return { columns: [], error: String(error) }
  }
}
