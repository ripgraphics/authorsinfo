"use server"

import { schemaService, ValidationResult } from "./supabase-schema-service"

/**
 * Validate insert payload against actual schema
 */
export async function validateInsertPayload(
  table: string,
  payload: Record<string, any>
): Promise<ValidationResult> {
  return await schemaService.validateInsertPayload(table, payload)
}

/**
 * Get only columns that exist in the table
 */
export async function getExistingColumns(
  table: string,
  columnNames: string[]
): Promise<string[]> {
  const schema = await schemaService.getTableSchema(table)
  const existingColumnNames = new Set(schema.columns.map(col => col.column_name))
  
  return columnNames.filter(col => existingColumnNames.has(col))
}

/**
 * Filter payload to only include columns that exist in the schema
 */
export async function filterPayloadBySchema(
  table: string,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  const validation = await validateInsertPayload(table, payload)
  return validation.filteredPayload
}

/**
 * Quick column existence check
 */
export async function checkColumnExists(
  table: string,
  columnName: string
): Promise<boolean> {
  return await schemaService.checkColumnExists(table, columnName)
}

/**
 * Get all existing columns for a table
 */
export async function getTableColumns(table: string): Promise<string[]> {
  const schema = await schemaService.getTableSchema(table)
  return schema.columns.map(col => col.column_name)
}

/**
 * Check if multiple columns exist
 */
export async function checkColumnsExist(
  table: string,
  columnNames: string[]
): Promise<Record<string, boolean>> {
  const schema = await schemaService.getTableSchema(table)
  const existingColumnNames = new Set(schema.columns.map(col => col.column_name))
  
  const result: Record<string, boolean> = {}
  for (const colName of columnNames) {
    result[colName] = existingColumnNames.has(colName)
  }
  
  return result
}

/**
 * Validate and filter payload, removing non-existent columns
 * Returns the filtered payload and any warnings
 */
export async function validateAndFilterPayload(
  table: string,
  payload: Record<string, any>
): Promise<{
  payload: Record<string, any>
  removedColumns: string[]
  warnings: string[]
}> {
  const validation = await validateInsertPayload(table, payload)
  const removedColumns = Object.keys(payload).filter(
    key => !(key in validation.filteredPayload)
  )
  
  return {
    payload: validation.filteredPayload,
    removedColumns,
    warnings: validation.warnings
  }
}

