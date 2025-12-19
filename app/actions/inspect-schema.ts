"use server"

import { schemaService } from "@/lib/schema/supabase-schema-service"
import type { TableSchema, ColumnInfo, RLSPolicy } from "@/lib/schema/supabase-schema-service"

/**
 * Get table columns using the comprehensive schema service
 * @deprecated Use schemaService.getTableSchema() directly for full schema information
 */
export async function getTableColumns(tableName: string) {
  try {
    const schema = await schemaService.getTableSchema(tableName)
    return { 
      columns: schema.columns.map(col => ({
        column_name: col.column_name,
        data_type: col.data_type,
        is_nullable: col.is_nullable
      })),
      error: null 
    }
  } catch (error) {
    console.error(`Error in getTableColumns for ${tableName}:`, error)
    return { 
      columns: [], 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

/**
 * Get full table schema including columns, RLS policies, and metadata
 */
export async function getTableSchema(tableName: string): Promise<{
  schema: TableSchema | null
  error: string | null
}> {
  try {
    const schema = await schemaService.getTableSchema(tableName)
    return { schema, error: null }
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error)
    return { 
      schema: null, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

/**
 * Get column information for a specific column
 */
export async function getColumnInfo(
  tableName: string, 
  columnName: string
): Promise<{
  column: ColumnInfo | null
  error: string | null
}> {
  try {
    const column = await schemaService.getColumnInfo(tableName, columnName)
    return { column, error: null }
  } catch (error) {
    console.error(`Error getting column info for ${tableName}.${columnName}:`, error)
    return { 
      column: null, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

/**
 * Get RLS policies for a table
 */
export async function getTableRLSPolicies(tableName: string): Promise<{
  policies: RLSPolicy[]
  error: string | null
}> {
  try {
    const schema = await schemaService.getTableSchema(tableName)
    return { policies: schema.rls_policies, error: null }
  } catch (error) {
    console.error(`Error getting RLS policies for ${tableName}:`, error)
    return { 
      policies: [], 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

/**
 * Check if a column exists in a table
 */
export async function checkColumnExists(
  tableName: string, 
  columnName: string
): Promise<{
  exists: boolean
  error: string | null
}> {
  try {
    const exists = await schemaService.checkColumnExists(tableName, columnName)
    return { exists, error: null }
  } catch (error) {
    console.error(`Error checking column existence for ${tableName}.${columnName}:`, error)
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

/**
 * Get all tables in the database
 */
export async function getAllTables(): Promise<{
  tables: string[]
  error: string | null
}> {
  try {
    const tables = await schemaService.getAllTables()
    return { tables, error: null }
  } catch (error) {
    console.error('Error getting all tables:', error)
    return { 
      tables: [], 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}
