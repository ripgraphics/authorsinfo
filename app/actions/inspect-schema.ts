"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

export async function getTableColumns(tableName: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", tableName)
      .eq("table_schema", "public")
      .order("ordinal_position")

    if (error) {
      console.error(`Error fetching columns for table ${tableName}:`, error)
      return { columns: [], error: error.message }
    }

    return { columns: data || [], error: null }
  } catch (error) {
    console.error(`Error in getTableColumns for ${tableName}:`, error)
    return { columns: [], error: String(error) }
  }
}
